import { auth, googleAuthProvider, facebookAuthProvider } from 'auth/FirebaseAuth';

const FirebaseService = {}

FirebaseService.signInEmailRequest = async (email, password) =>
	await auth.signInWithEmailAndPassword(email, password).then(user => user).catch(err => err);

FirebaseService.signInEmailRequest = async (email, password) =>
  await auth.signInWithEmailAndPassword(email, password).then(user => user).catch(err => err);
		
FirebaseService.signOutRequest = async () =>
	await auth.signOut().then(user => user).catch(err => err);

FirebaseService.signInGoogleRequest = async () =>
  await auth.signInWithPopup(googleAuthProvider).then(user => user).catch(err => err);

FirebaseService.signInFacebookRequest = async () =>
  await auth.signInWithPopup(facebookAuthProvider).then(user => user).catch(err => err);

FirebaseService.signUpEmailRequest = async (email, password,name) =>
	await auth.createUserWithEmailAndPassword(email, password).then(user => {
    console.log(name);
    user.user.updateProfile({
      displayName: name
    });
    return user;
  }).catch(err => err);	
	
export default FirebaseService