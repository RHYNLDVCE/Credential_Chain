import { NextResponse } from 'next/server';

export const successResponse = (data = {}, message = 'Operation successful', statusCode = 200, meta = {}) => {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    },
    { status: statusCode }
  );
};

export const errorResponse = (message = 'Internal Server Error', statusCode = 500, details = null) => {
  const payload = {
    success: false,
    error: {
      message,
      statusCode,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  if (details) {
    payload.error.details = details;
  }

  return NextResponse.json(payload, { status: statusCode });
};

export default {
  successResponse,
  errorResponse,
};
