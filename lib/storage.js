import {postgresStorage} from './postgres-storage.js';
// Never silently fall back to an empty or inaccessible legacy store.
export const get=(...args)=>postgresStorage().get(...args);
export const head=(...args)=>postgresStorage().head(...args);
export const put=(...args)=>postgresStorage().put(...args);
export const list=(...args)=>postgresStorage().list(...args);
export const readJson=(...args)=>postgresStorage().readJson(...args);
