import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
} from 'firebase/firestore';
import { auth, db } from './firebase';

// Sign Up User
export const signupUser = async (email, password, name) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // saving data
        await setDoc(doc(db, 'users', user.uid), {
            email: email,
            name: name,
            subjects: [],
            attendance: {},
            createdAt: new Date().toISOString(),
        });

        return { success: true, uid: user.uid };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Login User
export const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // get dtaa from db
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();

        return {
            success: true,
            uid: user.uid,
            email: user.email,
            name: userData?.name || '',
            subjects: userData?.subjects || [],
            attendance: userData?.attendance || {},
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Logout
export const logoutUser = async () => {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Add Subject
export const addSubjectToDB = async (uid, subjects) => {
    try {
        await updateDoc(doc(db, 'users', uid), {
            subjects: subjects,
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Add Attendance
export const addAttendanceToDB = async (uid, attendance) => {
    try {
        await updateDoc(doc(db, 'users', uid), {
            attendance: attendance,
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Update User Profile
export const updateUserProfile = async (uid, name) => {
    try {
        await updateDoc(doc(db, 'users', uid), {
            name: name,
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Monitor Auth State
export const onAuthChange = (callback) => {
    return onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.data();
            callback({
                uid: user.uid,
                email: user.email,
                name: userData?.name || '',
                subjects: userData?.subjects || [],
                attendance: userData?.attendance || {},
            });
        } else {
            callback(null);
        }
    });
};