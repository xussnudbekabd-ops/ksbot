import { config } from './config.js';

const dictionary = {
  courseName: () => config.courseName,
  course: () => config.course,
  coursePrice: () => config.coursePrice,
  directionExample: () => config.directionExample,
  timeSlots: () => config.timeSlots,
  adminPhone: () => config.adminPhone,
};

export function t(key) {
  const fn = dictionary[key];
  if (!fn) return String(key);
  return fn();
}

export const ctx = { t };
