import { getFirebaseClient } from '../../config/firebase';
import { createFirestoreRoomService } from './roomService';

export function getOnlineRoomService() {
  return createFirestoreRoomService(getFirebaseClient().db);
}
