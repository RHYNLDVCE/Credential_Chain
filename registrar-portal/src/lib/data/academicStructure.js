/**
 * MSU-TCTO Complete Academic Structure Directory
 * Scanned and compiled from the official Mindanao State University - Tawi-Tawi
 * College of Technology and Oceanography (MSU-TCTO) academic system.
 * 
 * Hierarchy:
 * College -> Departments -> Degree Programs -> Majors / Specializations / Tracks
 */

export const MSU_TCTO_ACADEMIC_STRUCTURE = [
  {
    id: 'CCS',
    code: 'CCS',
    name: 'College of Computer Studies',
    formerName: 'Institute of Information and Communications Technology (IICT)',
    departments: [
      {
        id: 'CCS-IT',
        name: 'Department of Information Technology',
        programs: [
          {
            title: 'Bachelor of Science in Information Technology',
            level: 'Undergraduate',
            degreeType: 'Bachelor’s',
            majors: [
              'Network Systems',
              'Database Systems',
              'Software Systems',
              'Cybersecurity and Network Systems',
              'General Information Technology',
            ],
          },
        ],
      },
      {
        id: 'CCS-CA',
        name: 'Department of Computer Applications',
        programs: [
          {
            title: 'Bachelor of Science in Computer Applications',
            level: 'Undergraduate',
            degreeType: 'Bachelor’s',
            majors: [
              'Embedded Systems (ES)',
              'Internet of Things (IOT)',
              'General Computer Applications',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'COFEST',
    code: 'COFEST',
    name: 'College of Oceanography, Fisheries, Environmental Science, and Technology',
    formerName: 'College of Fisheries & Institute of Oceanography and Environmental Science (IOES)',
    departments: [
      {
        id: 'COFEST-OC',
        name: 'Department of Oceanography',
        programs: [
          {
            title: 'Bachelor of Science in Oceanography',
            level: 'Undergraduate',
            degreeType: 'Bachelor’s',
            majors: [
              'Biological Oceanography',
              'Physical Oceanography',
              'Chemical Oceanography',
              'Marine Geology and Geophysics',
              'General Oceanography',
            ],
          },
        ],
      },
      {
        id: 'COFEST-MB',
        name: 'Department of Marine Biology',
        programs: [
          {
            title: 'Bachelor of Science in Marine Biology',
            level: 'Undergraduate',
            degreeType: 'Bachelor’s',
            majors: [
              'Marine Biodiversity and Ecology',
              'Coral Reef Ecology',
              'Marine Conservation',
              'General Marine Biology',
            ],
          },
        ],
      },
      {
        id: 'COFEST-ES',
        name: 'Department of Environmental Science',
        programs: [
          {
            title: 'Bachelor of Science in Environmental Science',
            level: 'Undergraduate',
            degreeType: 'Bachelor’s',
            majors: [
              'Aquatic and Terrestrial Ecosystem Management',
              'Environmental Problem-Solving and Conservation',
              'General Environmental Science',
            ],
          },
        ],
      },
      {
        id: 'COFEST-AQ',
        name: 'Department of Aquaculture',
        programs: [
          {
            title: 'Bachelor of Science in Fisheries',
            level: 'Undergraduate',
            degreeType: 'Bachelor’s',
            majors: [
              'Aquaculture',
            ],
          },
          {
            title: 'Diploma of Fisheries Technology',
            level: 'Diploma',
            degreeType: 'Undergraduate / Post-secondary',
            majors: [
              'Major in Aquaculture',
            ],
          },
          {
            title: 'Master of Science in Aquaculture',
            level: 'Graduate',
            degreeType: 'Master’s Degree',
            majors: [
              'Aquaculture Nutrition and Pathology',
              'Hatchery and Farming Technology',
              'General Aquaculture',
            ],
          },
        ],
      },
      {
        id: 'COFEST-CF',
        name: 'Department of Capture Fisheries',
        programs: [
          {
            title: 'Bachelor of Science in Fisheries',
            level: 'Undergraduate',
            degreeType: 'Bachelor’s',
            majors: [
              'Capture Fisheries',
            ],
          },
        ],
      },
      {
        id: 'COFEST-PH',
        name: 'Department of Post-Harvest Fisheries',
        programs: [
          {
            title: 'Bachelor of Science in Fisheries',
            level: 'Undergraduate',
            degreeType: 'Bachelor’s',
            majors: [
              'Post-Harvest Fisheries',
            ],
          },
          {
            title: 'Diploma in Fisheries Technology',
            level: 'Diploma',
            degreeType: 'Undergraduate / Post-secondary',
            majors: [
              'Major in Fish Processing',
            ],
          },
        ],
      },
      {
        id: 'COFEST-ARM',
        name: 'Department of Aquatic Resources Management',
        programs: [
          {
            title: 'Bachelor of Science in Fisheries',
            level: 'Undergraduate',
            degreeType: 'Bachelor’s',
            majors: [
              'Aquatic Resources Management',
            ],
          },
        ],
      },
      {
        id: 'COFEST-FT',
        name: 'Department of Food Science and Technology',
        programs: [
          {
            title: 'Bachelor of Science in Food Technology',
            level: 'Undergraduate',
            degreeType: 'Bachelor’s',
            majors: [
              'Food Processing and Preservation',
              'Food Quality and Safety Management',
              'General Food Technology',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'COED',
    code: 'COED',
    name: 'College of Education',
    departments: [
      {
        id: 'COED-EED',
        name: 'Department of Early Childhood and Elementary Education',
        programs: [
          {
            title: 'Bachelor of Elementary Education',
            level: 'Undergraduate',
            degreeType: 'Bachelor’s',
            majors: [
              'General Elementary Education',
            ],
          },
          {
            title: 'Bachelor of Early Childhood Education',
            level: 'Undergraduate',
            degreeType: 'Bachelor’s',
            majors: [
              'Early Childhood Education',
            ],
          },
          {
            title: 'Master of Arts in Education',
            level: 'Graduate',
            degreeType: 'Master’s Degree',
            majors: [
              'Major in Early Childhood Education',
            ],
          },
        ],
      },
      {
        id: 'COED-SME',
        name: 'Department of Science and Mathematics Education',
        programs: [
          {
            title: 'Bachelor of Secondary Education',
            level: 'Undergraduate',
            degreeType: 'Bachelor’s',
            majors: [
              'Major in Science',
              'Major in Mathematics',
            ],
          },
          {
            title: 'Master of Science Education',
            level: 'Graduate',
            degreeType: 'Master’s Degree',
            majors: [
              'Major in Secondary Mathematics',
              'Major in General Science',
            ],
          },
        ],
      },
      {
        id: 'COED-LE',
        name: 'Department of Language Education',
        programs: [
          {
            title: 'Bachelor of Secondary Education',
            level: 'Undergraduate',
            degreeType: 'Bachelor’s',
            majors: [
              'Major in English',
              'Major in Filipino',
            ],
          },
          {
            title: 'Master of Arts in English Language Teaching',
            level: 'Graduate',
            degreeType: 'Master’s Degree',
            majors: [
              'English Language Teaching',
            ],
          },
          {
            title: 'Master of Arts in Education',
            level: 'Graduate',
            degreeType: 'Master’s Degree',
            majors: [
              'Major in Reading',
            ],
          },
        ],
      },
      {
        id: 'COED-PE',
        name: 'Department of Physical Education',
        programs: [
          {
            title: 'Bachelor of Physical Education',
            level: 'Undergraduate',
            degreeType: 'Bachelor’s',
            majors: [
              'Physical Education and Sports Coaching',
              'General Physical Education',
            ],
          },
          {
            title: 'Professional Diploma in Physical Education',
            level: 'Diploma',
            degreeType: 'Diploma',
            majors: [
              'Physical Education',
            ],
          },
        ],
      },
      {
        id: 'COED-ELPS',
        name: 'Department of Educational Leadership and Professional Services',
        programs: [
          {
            title: 'Master of Arts in Education',
            level: 'Graduate',
            degreeType: 'Master’s Degree',
            majors: [
              'Educational Management',
            ],
          },
          {
            title: 'Doctor of Philosophy in Education',
            level: 'Doctoral',
            degreeType: 'Doctor of Philosophy',
            majors: [
              'Educational Management',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'CBAM',
    code: 'CBAM',
    name: 'College of Business, Accountancy, and Management',
    departments: [
      {
        id: 'CBAM-BA',
        name: 'Department of Management and Business Administration',
        programs: [
          {
            title: 'Bachelor of Science in Business Administration',
            level: 'Undergraduate',
            degreeType: 'Bachelor’s',
            majors: [
              'Marketing Management',
              'Financial Management',
              'Human Resource Management',
              'Operations Management',
            ],
          },
        ],
      },
      {
        id: 'CBAM-ACC',
        name: 'Department of Accountancy',
        programs: [
          {
            title: 'Bachelor of Science in Accountancy',
            level: 'Undergraduate',
            degreeType: 'Bachelor’s',
            majors: [
              'Accountancy and Auditing',
              'General Accountancy',
            ],
          },
        ],
      },
      {
        id: 'CBAM-OA',
        name: 'Department of Office Administration',
        programs: [
          {
            title: 'Diploma in Office Management',
            level: 'Diploma',
            degreeType: 'Diploma',
            majors: [
              'Office Administration and Records Management',
              'General Office Management',
            ],
          },
        ],
      },
      {
        id: 'CBAM-HTM',
        name: 'Department of Hospitality and Tourism Management',
        programs: [
          {
            title: 'Bachelor of Science in Hospitality Management',
            level: 'Undergraduate',
            degreeType: 'Bachelor’s',
            majors: [
              'Hotel and Restaurant Management',
              'General Hospitality Management',
            ],
          },
          {
            title: 'Bachelor of Science in Tourism Management',
            level: 'Undergraduate',
            degreeType: 'Bachelor’s',
            majors: [
              'Ecotourism and Destination Management',
              'General Tourism Management',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'CASS',
    code: 'CASS',
    name: 'College of Arts and Social Sciences',
    departments: [
      {
        id: 'CASS-PS',
        name: 'Department of Political Science',
        programs: [
          {
            title: 'Bachelor of Arts in Political Science',
            level: 'Undergraduate',
            degreeType: 'Bachelor’s',
            majors: [
              'Political Science',
              'International Relations and Governance',
            ],
          },
        ],
      },
      {
        id: 'CASS-HIST',
        name: 'Department of History',
        programs: [
          {
            title: 'Bachelor of Arts in History',
            level: 'Undergraduate',
            degreeType: 'Bachelor’s',
            majors: [
              'History and Bangsamoro Studies',
              'General History',
            ],
          },
        ],
      },
      {
        id: 'CASS-LANG',
        name: 'Department of Languages',
        programs: [
          {
            title: 'Bachelor of Arts in English Language Studies',
            level: 'Undergraduate',
            degreeType: 'Bachelor’s',
            majors: [
              'English Language Studies',
              'Applied Linguistics',
            ],
          },
        ],
      },
      {
        id: 'CASS-LCS',
        name: 'Department of Literary and Cultural Studies',
        programs: [
          {
            title: 'Bachelor of Arts in Literary and Cultural Studies',
            level: 'Undergraduate',
            degreeType: 'Bachelor’s',
            majors: [
              'Literary and Cultural Studies',
            ],
          },
        ],
      },
      {
        id: 'CASS-PA',
        name: 'Department of Public Administration',
        programs: [
          {
            title: 'Bachelor of Public Administration',
            level: 'Undergraduate',
            degreeType: 'Bachelor’s',
            majors: [
              'Public Administration',
              'Local Governance and Public Policy',
            ],
          },
          {
            title: 'Master of Public Administration',
            level: 'Graduate',
            degreeType: 'Master’s Degree',
            majors: [
              'Public Administration',
              'Public Policy and Administration',
            ],
          },
        ],
      },
      {
        id: 'CASS-WPS',
        name: 'Peace and Security Studies Unit',
        programs: [
          {
            title: 'Diploma in Women, Peace, and Security',
            level: 'Diploma',
            degreeType: 'Diploma',
            majors: [
              'Women, Peace, and Security Studies',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'CIAS',
    code: 'CIAS',
    name: 'College of Islamic Arts and Sciences',
    departments: [
      {
        id: 'CIAS-IS',
        name: 'Department of Islamic Studies',
        programs: [
          {
            title: 'Bachelor of Arts in Islamic Studies',
            level: 'Undergraduate',
            degreeType: 'Bachelor’s',
            majors: [
              'Major in Shari’ah (Islamic Law)',
              'Islamic Education',
              'General Islamic Studies',
            ],
          },
        ],
      },
      {
        id: 'CIAS-TA',
        name: 'Department of Teaching Arabic',
        programs: [
          {
            title: 'Bachelor of Science in Teaching Arabic',
            level: 'Undergraduate',
            degreeType: 'Bachelor’s',
            majors: [
              'Teaching Arabic as a Second Language',
              'Arabic Language and Literature',
            ],
          },
        ],
      },
      {
        id: 'CIAS-GIE',
        name: 'Department of Graduate Islamic Education',
        programs: [
          {
            title: 'Master of Arts in Islamic Education (MAIsEd)',
            level: 'Graduate',
            degreeType: 'Master’s Degree',
            majors: [
              'Islamic Educational Leadership',
              'Curriculum and Instruction in Islamic Education',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'CMS',
    code: 'CMS',
    name: 'College of Mathematical Sciences',
    departments: [
      {
        id: 'CMS-MATH',
        name: 'Department of Mathematics',
        programs: [
          {
            title: 'Bachelor of Science in Mathematics',
            level: 'Undergraduate',
            degreeType: 'Bachelor’s',
            majors: [
              'Pure Mathematics',
              'Applied Mathematics',
            ],
          },
          {
            title: 'Master of Science in Mathematics',
            level: 'Graduate',
            degreeType: 'Master’s Degree',
            majors: [
              'Pure and Applied Mathematics',
            ],
          },
        ],
      },
      {
        id: 'CMS-STAT',
        name: 'Department of Statistics',
        programs: [
          {
            title: 'Bachelor of Science in Statistics',
            level: 'Undergraduate',
            degreeType: 'Bachelor’s',
            majors: [
              'Statistical Computing and Data Analysis',
              'Applied Statistics',
              'General Statistics',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'COL',
    code: 'COL',
    name: 'College of Law (Tawi-Tawi Extension)',
    departments: [
      {
        id: 'COL-LAW',
        name: 'Department of Legal Studies',
        programs: [
          {
            title: 'Juris Doctor',
            level: 'Graduate/Professional Doctorate',
            degreeType: 'Professional Doctorate',
            majors: [
              'General Law and Jurisprudence',
              'Islamic Law and Shari’ah Jurisprudence',
            ],
          },
        ],
      },
    ],
  },
];

/**
 * Returns all colleges in MSU-TCTO
 */
export const getAllColleges = () => {
  return MSU_TCTO_ACADEMIC_STRUCTURE.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
  }));
};

/**
 * Returns departments for a given college code or id
 */
export const getDepartmentsByCollege = (collegeIdOrCode) => {
  const college = MSU_TCTO_ACADEMIC_STRUCTURE.find(
    (c) => c.id === collegeIdOrCode || c.code === collegeIdOrCode || c.name === collegeIdOrCode
  );
  if (!college) return [];
  return college.departments.map((d) => ({
    id: d.id,
    name: d.name,
  }));
};

/**
 * Returns programs for a given college and department
 */
export const getProgramsByDepartment = (collegeIdOrCode, departmentIdOrName) => {
  const college = MSU_TCTO_ACADEMIC_STRUCTURE.find(
    (c) => c.id === collegeIdOrCode || c.code === collegeIdOrCode || c.name === collegeIdOrCode
  );
  if (!college) return [];
  const dept = college.departments.find(
    (d) => d.id === departmentIdOrName || d.name === departmentIdOrName
  );
  if (!dept) return [];
  return dept.programs.map((p) => ({
    title: p.title,
    level: p.level,
    degreeType: p.degreeType,
    majors: p.majors,
  }));
};

/**
 * Returns majors for a given college, department, and program
 */
export const getMajorsByProgram = (collegeIdOrCode, departmentIdOrName, programTitle) => {
  const programs = getProgramsByDepartment(collegeIdOrCode, departmentIdOrName);
  const prog = programs.find((p) => p.title.toLowerCase() === (programTitle || '').toLowerCase());
  return prog ? prog.majors : [];
};

/**
 * Helper to lookup college and department from a degreeTitle
 */
export const lookupAcademicHierarchy = (degreeTitle) => {
  if (!degreeTitle) return null;
  const search = degreeTitle.toLowerCase().trim();
  for (const col of MSU_TCTO_ACADEMIC_STRUCTURE) {
    for (const dept of col.departments) {
      for (const prog of dept.programs) {
        if (prog.title.toLowerCase() === search || search.includes(prog.title.toLowerCase())) {
          return {
            college: col.name,
            collegeCode: col.code,
            department: dept.name,
            program: prog.title,
            majors: prog.majors,
          };
        }
      }
    }
  }
  return null;
};

export default MSU_TCTO_ACADEMIC_STRUCTURE;
