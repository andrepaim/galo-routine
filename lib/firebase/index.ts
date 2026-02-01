export { app, auth, db } from './config';
export {
  onAuthChange,
  registerParent,
  loginParent,
  signOut,
  getFamilyDoc,
  verifyChildPin,
} from './auth';
export {
  updateFamilySettings,
  updateFamily,
  subscribeToFamily,
  createTask,
  updateTask,
  deleteTask,
  subscribeTasks,
  createPeriod,
  updatePeriod,
  subscribePeriods,
  getActivePeriod,
  createCompletion,
  updateCompletion,
  subscribeCompletions,
  getCompletionsForDate,
} from './firestore';
