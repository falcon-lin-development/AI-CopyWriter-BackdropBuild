// This file exist to handle a bug in redux-persist
// reference: https://www.youtube.com/watch?v=fjPIJZ1Eokg&ab_channel=RodrigoM%C3%A9ndez

// import storage from 'redux-persist/lib/storage';
// import sessionStorage from 'redux-persist/lib/storage/session';
import createWebStorage from 'redux-persist/lib/storage/createWebStorage';

const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: string) {
      return Promise.resolve(value);
    },
    removeItem(_key: string) {
      return Promise.resolve();
    },
  };
};
export const storage =
  typeof window !== 'undefined'
    ? createWebStorage('local')
    : createNoopStorage();
export const sessionStorage =
  typeof window !== 'undefined'
    ? createWebStorage('session')
    : createNoopStorage();

    