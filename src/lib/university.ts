export const DEFAULT_UNIVERSITY_ID = "4b672fb8-dc7a-4603-b244-b0863ab24bbf";
export const DEFAULT_UNIVERSITY_NAME = "Federal University Dutsin-Ma (FUDMA)";
export const DEFAULT_UNIVERSITY_SHORT = "FUDMA";
export const DEFAULT_UNIVERSITY_LOCATION = "Dutsin-Ma, Katsina State";
export const UNIVERSITY_TAGLINE = "Directorate of Students Industrial Work Experience Scheme (SIWES)";

export const UNIVERSITY_FACULTIES = [
  "Faculty of Computing & Information Technology",
  "Faculty of Physical Sciences",
  "Faculty of Life Sciences",
  "Faculty of Engineering & Technology",
  "Faculty of Agriculture & Agricultural Technology",
  "Faculty of Environmental Sciences",
  "Faculty of Management Sciences",
  "Faculty of Social Sciences",
  "Faculty of Arts",
  "Faculty of Education",
  "Faculty of Basic Medical Sciences",
];

export const UNIVERSITY_DEPARTMENTS: Record<string, string[]> = {
  "Faculty of Computing & Information Technology": [
    "Computer Science",
    "Information Technology",
    "Software Engineering",
    "Cyber Security",
  ],
  "Faculty of Physical Sciences": [
    "Physics & Electronics",
    "Industrial Chemistry",
    "Mathematics",
    "Geology",
    "Statistics",
  ],
  "Faculty of Life Sciences": [
    "Microbiology",
    "Biochemistry",
    "Plant Science & Biotechnology",
    "Animal & Environmental Biology",
  ],
  "Faculty of Engineering & Technology": [
    "Agricultural & Bio-Resources Engineering",
    "Civil Engineering",
    "Electrical & Electronics Engineering",
    "Mechanical Engineering",
    "Mechatronics Engineering",
    "Chemical Engineering",
  ],
  "Faculty of Agriculture & Agricultural Technology": [
    "Agricultural Economics & Extension",
    "Animal Science",
    "Crop Production & Protection",
    "Fisheries & Aquaculture",
    "Forestry & Wildlife Management",
    "Food Science & Technology",
    "Soil Science",
  ],
  "Faculty of Environmental Sciences": [
    "Architecture",
    "Building Technology",
    "Estate Management",
    "Urban & Regional Planning",
    "Surveying & Geo-Informatics",
    "Environmental Management",
  ],
  "Faculty of Management Sciences": [
    "Accounting",
    "Business Management",
    "Banking & Finance",
    "Public Administration",
    "Marketing",
  ],
  "Faculty of Social Sciences": [
    "Economics",
    "Political Science",
    "Sociology",
    "Geography & Regional Planning",
    "Mass Communication",
  ],
  "Faculty of Arts": [
    "English & Literary Studies",
    "History & Diplomatic Studies",
    "Arabic & Islamic Studies",
    "Hausa",
    "Linguistics",
  ],
  "Faculty of Education": [
    "Science Education (Biology, Chemistry, Physics, Maths)",
    "Educational Management",
    "Library & Information Science",
    "Vocational & Technical Education",
  ],
  "Faculty of Basic Medical Sciences": [
    "Medical Laboratory Science",
    "Nursing Science",
    "Human Anatomy",
    "Human Physiology",
    "Public Health",
  ],
};

export function getPrimaryUniversity() {
  return {
    id: DEFAULT_UNIVERSITY_ID,
    name: DEFAULT_UNIVERSITY_NAME,
    shortName: DEFAULT_UNIVERSITY_SHORT,
    location: DEFAULT_UNIVERSITY_LOCATION,
    type: "Federal University",
    state: "Katsina",
  };
}
