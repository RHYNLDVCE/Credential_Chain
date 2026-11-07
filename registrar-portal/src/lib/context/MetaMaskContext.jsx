'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const MetaMaskContext = createContext(null);

const TARGET_CHAIN_ID_HEX = '0xaa36a7'; // 11155111 (Sepolia)
const TARGET_CHAIN_ID_DEC = 11155111;
const DEFAULT_CONTRACT_ADDRESS = '0x4E7982A2753C1D7B600A1f3997fF48A4d701CbbC';

const MINIMAL_ABI = [
  'function DEFAULT_ADMIN_ROLE() view returns (bytes32)',
  'function REGISTRAR_ROLE() view returns (bytes32)',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
];

export function MetaMaskProvider({ children }) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contractAddress, setContractAddress] = useState(DEFAULT_CONTRACT_ADDRESS);

  const [roles, setRoles] = useState({
    isRegistrar: false,
    isAdmin: false,
    isChecking: false,
  });

  // Check if MetaMask is available
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      setIsInstalled(true);
    }
  }, []);

  // Fetch contract address and target chain from system health
  useEffect(() => {
    fetch('/api/system/health')
      .then((res) => res.json())
      .then((data) => {
        if (data?.contract?.address) {
          setContractAddress(data.contract.address);
        }
      })
      .catch(() => {});
  }, []);

  const getNetworkName = (id) => {
    if (!id) return 'Unknown';
    const dec = typeof id === 'string' && id.startsWith('0x') ? parseInt(id, 16) : Number(id);
    switch (dec) {
      case 1:
        return 'Ethereum Mainnet';
      case 11155111:
        return 'Ethereum Sepolia';
      case 17000:
        return 'Holesky';
      case 31337:
        return 'Anvil Localhost';
      case 1337:
        return 'Localhost';
      default:
        return `Chain ID: ${dec}`;
    }
  };

  const isCorrectNetwork = Boolean(
    chainId &&
      (chainId === TARGET_CHAIN_ID_HEX ||
        Number(chainId) === TARGET_CHAIN_ID_DEC ||
        parseInt(chainId, 16) === TARGET_CHAIN_ID_DEC)
  );

  // Check on-chain roles for an address
  const checkContractRoles = useCallback(
    async (addressToCheck) => {
      if (!addressToCheck || !ethers.isAddress(addressToCheck)) return;

      setRoles((prev) => ({ ...prev, isChecking: true }));
      try {
        let provider;
        if (typeof window !== 'undefined' && window.ethereum) {
          provider = new ethers.BrowserProvider(window.ethereum);
        } else {
          provider = new ethers.JsonRpcProvider('https://rpc.sepolia.org');
        }

        const contract = new ethers.Contract(contractAddress, MINIMAL_ABI, provider);
        const adminRole = await contract.DEFAULT_ADMIN_ROLE();
        const registrarRole = await contract.REGISTRAR_ROLE();

        const [isAdmin, isRegistrar] = await Promise.all([
          contract.hasRole(adminRole, addressToCheck),
          contract.hasRole(registrarRole, addressToCheck),
        ]);

        setRoles({
          isAdmin: Boolean(isAdmin),
          isRegistrar: Boolean(isRegistrar),
          isChecking: false,
        });
      } catch (err) {
        console.warn('Could not query on-chain roles for account:', err);
        setRoles({
          isAdmin: false,
          isRegistrar: false,
          isChecking: false,
        });
      }
    },
    [contractAddress]
  );

  // Refresh balance and roles
  const refreshAccountDetails = useCallback(
    async (currentAccount) => {
      if (!currentAccount || typeof window === 'undefined' || !window.ethereum) return;

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const bal = await provider.getBalance(currentAccount);
        setBalance(parseFloat(ethers.formatEther(bal)).toFixed(4));
      } catch (err) {
        console.warn('Failed to load balance:', err);
      }

      await checkContractRoles(currentAccount);
    },
    [checkContractRoles]
  );

  // Initialize and check current accounts silently
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const eth = window.ethereum;

    const handleAccountsChanged = (accounts) => {
      if (accounts && accounts.length > 0) {
        const checksum = ethers.getAddress(accounts[0]);
        setAccount(checksum);
        localStorage.setItem('msu_metamask_connected', 'true');
        refreshAccountDetails(checksum);
      } else {
        setAccount(null);
        setBalance(null);
        setRoles({ isRegistrar: false, isAdmin: false, isChecking: false });
        localStorage.removeItem('msu_metamask_connected');
      }
    };

    const handleChainChanged = (newChainId) => {
      setChainId(newChainId);
      if (account) {
        refreshAccountDetails(account);
      }
    };

    eth
      .request({ method: 'eth_chainId' })
      .then((id) => setChainId(id))
      .catch(() => {});

    // Silent check if previously connected
    if (localStorage.getItem('msu_metamask_connected') === 'true') {
      eth
        .request({ method: 'eth_accounts' })
        .then((accounts) => {
          if (accounts && accounts.length > 0) {
            handleAccountsChanged(accounts);
          }
        })
        .catch(() => {});
    }

    eth.on('accountsChanged', handleAccountsChanged);
    eth.on('chainChanged', handleChainChanged);

    return () => {
      if (eth.removeListener) {
        eth.removeListener('accountsChanged', handleAccountsChanged);
        eth.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [account, refreshAccountDetails]);

  // Connect wallet
  const connect = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('MetaMask is not installed. Please install the MetaMask extension.');
      return null;
    }

    setIsConnecting(true);
    setError('');

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts selected in MetaMask.');
      }

      const checksum = ethers.getAddress(accounts[0]);
      setAccount(checksum);
      localStorage.setItem('msu_metamask_connected', 'true');

      const currentChain = await window.ethereum.request({ method: 'eth_chainId' });
      setChainId(currentChain);

      await refreshAccountDetails(checksum);
      return checksum;
    } catch (err) {
      const msg = err.code === 4001 ? 'Connection rejected in MetaMask.' : err.message || 'Failed to connect MetaMask.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    setAccount(null);
    setBalance(null);
    setRoles({ isRegistrar: false, isAdmin: false, isChecking: false });
    localStorage.removeItem('msu_metamask_connected');
    setIsModalOpen(false);
  };

  // Switch network to Sepolia
  const switchNetwork = async () => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    setError('');
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: TARGET_CHAIN_ID_HEX }],
      });
      setChainId(TARGET_CHAIN_ID_HEX);
    } catch (switchError) {
      // 4902 means the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: TARGET_CHAIN_ID_HEX,
                chainName: 'Ethereum Sepolia Testnet',
                nativeCurrency: {
                  name: 'SepoliaETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://rpc.sepolia.org', 'https://eth-sepolia.public.blastapi.io'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
          setChainId(TARGET_CHAIN_ID_HEX);
        } catch (addError) {
          setError('Failed to add Sepolia testnet to MetaMask: ' + addError.message);
        }
      } else {
        setError('Failed to switch network: ' + switchError.message);
      }
    }
  };

  // Fast One-Click Sign In with MetaMask
  const loginWithMetaMask = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    setIsLoggingIn(true);
    setError('');

    try {
      // 1. Ensure connected
      let targetAddress = account;
      if (!targetAddress) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (!accounts || accounts.length === 0) {
          throw new Error('Please select an account in MetaMask.');
        }
        targetAddress = ethers.getAddress(accounts[0]);
        setAccount(targetAddress);
        localStorage.setItem('msu_metamask_connected', 'true');
      }

      // 2. Prepare Challenge
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const currentAddress = await signer.getAddress();
      const timestamp = Date.now();
      const nonce = Math.random().toString(36).substring(2, 12);

      const message =
        `Mindanao State University - TCTO\n` +
        `Academic Credential Verification System\n\n` +
        `Sign in as Institutional Registrar / Admin\n\n` +
        `Wallet: ${currentAddress}\n` +
        `Timestamp: ${timestamp}\n` +
        `Nonce: ${nonce}`;

      // 3. User signs cryptographic challenge
      const signature = await signer.signMessage(message);

      // 4. Send to backend endpoint
      const res = await fetch('/api/auth/metamask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: currentAddress,
          signature,
          message,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'MetaMask authentication failed.');
      }

      // 5. Store session in localStorage
      localStorage.setItem('msu_registrar_token', data.data.token);
      localStorage.setItem('msu_registrar_user', JSON.stringify(data.data.user));

      await refreshAccountDetails(currentAddress);

      return {
        token: data.data.token,
        user: data.data.user,
      };
    } catch (err) {
      const msg = err.code === 4001 ? 'Sign-in cancelled in MetaMask.' : err.message || 'MetaMask sign-in failed.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <MetaMaskContext.Provider
      value={{
        isInstalled,
        account,
        chainId,
        networkName: getNetworkName(chainId),
        isCorrectNetwork,
        targetChainIdHex: TARGET_CHAIN_ID_HEX,
        targetChainIdDec: TARGET_CHAIN_ID_DEC,
        balance,
        isConnecting,
        isLoggingIn,
        error,
        setError,
        roles,
        contractAddress,
        isModalOpen,
        setIsModalOpen,
        connect,
        disconnect,
        switchNetwork,
        loginWithMetaMask,
        refreshAccountDetails,
      }}
    >
      {children}
    </MetaMaskContext.Provider>
  );
}

export const useMetaMask = () => {
  const context = useContext(MetaMaskContext);
  if (!context) {
    throw new Error('useMetaMask must be used within a MetaMaskProvider');
  }
  return context;
};
