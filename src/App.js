import React, { useState, useEffect } from 'react';
import { Calendar, Plus, LogOut, Trash2, Eye, EyeOff } from 'lucide-react';
import { signupUser, loginUser, logoutUser, addSubjectToDB, addAttendanceToDB, onAuthChange } from './backend/dbservice';

export default function AttendanceTracker() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentPage, setCurrentPage] = useState('login');
  const [authMode, setAuthMode] = useState('login');
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [attendance, setAttendance] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [duration, setDuration] = useState('1');
  const [status, setStatus] = useState('attended');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user) {
        setCurrentUser(user.uid);
        setUserName(user.name);
        setSubjects(user.subjects);
        setAttendance(user.attendance);
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAuth = async () => {
    if (!loginEmail || !loginPassword) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);

    if (authMode === 'signup') {
      if (!userName.trim()) {
        alert('Please enter your name');
        setLoading(false);
        return;
      }
      const result = await signupUser(loginEmail, loginPassword, userName);
      if (result.success) {
        alert('Account created successfully! Please login.');
        setAuthMode('login');
        setLoginEmail('');
        setLoginPassword('');
        setUserName('');
      } else {
        alert('Signup failed: ' + result.error);
      }

    } else {
      const result = await loginUser(loginEmail, loginPassword);
      if (result.success) {
        setCurrentUser(result.uid);
        setUserName(result.name);
        setSubjects(result.subjects);
        setAttendance(result.attendance);
        setCurrentPage('stats');
        setLoginEmail('');
        setLoginPassword('');
      } else {
        alert('Login failed: ' + result.error);
      }
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      setCurrentUser(null);
      setCurrentPage('login');
      setUserName('');
      setSubjects([]);
      setAttendance({});
    }
  };

  const addSubject = async () => {
    if (newSubject.trim()) {
      const updatedSubjects = [...subjects, newSubject];
      setSubjects(updatedSubjects);
      if (currentUser) {
        await addSubjectToDB(currentUser, updatedSubjects);
      }

      setNewSubject('');
    }
  };

  const deleteSubject = async (index) => {
    const updatedSubjects = subjects.filter((_, i) => i !== index);
    setSubjects(updatedSubjects);
    if (currentUser) {
      await addSubjectToDB(currentUser, updatedSubjects);
    }
  };

  const addAttendance = async () => {
    if (selectedDate && selectedSubject && duration) {
      const key = `${selectedDate}-${selectedSubject}`;
      const updatedAttendance = {
        ...attendance,
        [key]: {
          subject: selectedSubject,
          date: selectedDate,
          status,
          duration: parseInt(duration)
        }
      };
      setAttendance(updatedAttendance);
      if (currentUser) {
        await addAttendanceToDB(currentUser, updatedAttendance);
      }

      setSelectedDate(new Date().toISOString().split('T')[0]);
      setSelectedSubject('');
      setDuration('1');
      setStatus('attended');
    }
  };

  const deleteAttendance = async (key) => {
    const updatedAttendance = { ...attendance };
    delete updatedAttendance[key];
    setAttendance(updatedAttendance);
    if (currentUser) {
      await addAttendanceToDB(currentUser, updatedAttendance);
    }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getAttendanceCount = (subject) => {
    return Object.values(attendance).reduce((sum, record) => {
      if (record.subject === subject && record.status === 'attended') {
        return sum + record.duration;
      }
      return sum;
    }, 0);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-20 bg-gray-50"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayRecords = Object.values(attendance).filter(r => r.date === dateStr);

      days.push(
        <div key={day} className="h-20 border border-gray-300 p-1 bg-white hover:bg-blue-50">
          <div className="font-semibold text-sm mb-1">{day}</div>
          <div className="text-xs space-y-0.5">
            {dayRecords.map((record, idx) => (
              <div
                key={idx}
                className={`px-1 py-0.5 rounded text-white truncate ${record.status === 'attended' ? 'bg-green-500' :
                  record.status === 'cancelled' ? 'bg-gray-500' :
                    'bg-red-500'
                  }`}
              >
                {record.subject} +{record.duration}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Attendance Tracker</h1>
          <p className="text-gray-600 mb-8">Track your university classes efficiently</p>

          <div className="space-y-4">
            {authMode === 'signup' && (
              <input
                type="text"
                placeholder="Full Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <button
              onClick={handleAuth}
              disabled={loading}
              style={{ backgroundColor: '#90AB8B' }}
              className="w-full text-white py-2 rounded-lg hover:opacity-90 font-semibold disabled:opacity-50"
            >
              {loading ? 'Processing...' : (authMode === 'login' ? 'Login' : 'Sign Up')}
            </button>
          </div>

          <button
            onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
            style={{ color: '#90AB8B' }}
            className="w-full mt-4 hover:opacity-90 font-semibold text-sm"
          >
            {authMode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav style={{ backgroundColor: '#3B4953' }} className="text-white p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Calendar size={28} />
            <h1 className="text-2xl font-bold">Attendance Tracker</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold">{userName}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setCurrentPage('subjects')}
            className={`px-6 py-2 rounded-lg font-semibold ${currentPage === 'subjects'
              ? 'text-white'
              : 'bg-white text-gray-800 hover:bg-gray-50'
              }`}
            style={currentPage === 'subjects' ? { backgroundColor: '#5A7863' } : {}}
          >
            Subjects
          </button>
          <button
            onClick={() => setCurrentPage('calendar')}
            className={`px-6 py-2 rounded-lg font-semibold ${currentPage === 'calendar'
              ? 'text-white'
              : 'bg-white text-gray-800 hover:bg-gray-50'
              }`}
            style={currentPage === 'calendar' ? { backgroundColor: '#5A7863' } : {}}
          >
            Calendar
          </button>
          <button
            onClick={() => setCurrentPage('stats')}
            className={`px-6 py-2 rounded-lg font-semibold ${currentPage === 'stats'
              ? 'text-white'
              : 'bg-white text-gray-800 hover:bg-gray-50'
              }`}
            style={currentPage === 'stats' ? { backgroundColor: '#5A7863' } : {}}
          >
            Statistics
          </button>
        </div>

        {currentPage === 'subjects' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">My Subjects</h2>
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="Enter subject name"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSubject()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              />
              <button
                onClick={addSubject}
                style={{ backgroundColor: '#90AB8B' }}
                className="hover:opacity-90 text-white px-6 py-2 rounded-lg flex items-center gap-2"
              >
                <Plus size={20} /> Add Subject
              </button>
            </div>

            <div className="grid gap-4">
              {subjects.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No subjects added yet</p>
              ) : (
                subjects.map((subject, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div>
                      <p className="font-semibold text-gray-800">{subject}</p>
                      <p className="text-sm text-gray-600">Hours attended: {getAttendanceCount(subject)}</p>
                    </div>
                    <button
                      onClick={() => deleteSubject(idx)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Trash2 size={18} /> Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {currentPage === 'calendar' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Add Attendance</h2>
              <div className="grid md:grid-cols-5 gap-4">
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" />
                <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2">
                  <option value="">Select Subject</option>
                  {subjects.map((subj) => (<option key={subj} value={subj}>{subj}</option>))}
                </select>
                <input type="number" min="1" max="8" value={duration} onChange={(e) => setDuration(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" placeholder="Hours" />
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2">
                  <option value="attended">Attended</option>
                  <option value="not-attended">Not Attended</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button onClick={addAttendance} style={{ backgroundColor: '#90AB8B' }} className="hover:opacity-90 text-white px-6 py-2 rounded-lg font-semibold">Add</button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} style={{ backgroundColor: '#90AB8B' }} className="hover:opacity-90 text-white px-4 py-2 rounded-lg">← Prev</button>
                  <button onClick={() => setCurrentMonth(new Date())} style={{ backgroundColor: '#5A7863' }} className="hover:opacity-90 text-white px-4 py-2 rounded-lg">Today</button>
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} style={{ backgroundColor: '#90AB8B' }} className="hover:opacity-90 text-white px-4 py-2 rounded-lg">Next →</button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-0 border border-gray-300 rounded-lg overflow-hidden">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (<div key={day} style={{ backgroundColor: '#5A7863' }} className="text-white font-bold text-center py-2">{day}</div>))}
                {renderCalendar()}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Recent Entries</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(attendance).sort((a, b) => new Date(b[1].date) - new Date(a[1].date)).slice(0, 10).map(([key, record]) => (
                  <div key={key} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm">
                      <span className="font-semibold">{record.subject}</span> - {record.date}
                      <span className={`ml-2 px-2 py-1 rounded text-white text-xs ${record.status === 'attended' ? 'bg-green-500' : record.status === 'cancelled' ? 'bg-gray-500' : 'bg-red-500'}`}>{record.status} +{record.duration}h</span>
                    </div>
                    <button onClick={() => deleteAttendance(key)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentPage === 'stats' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Attendance Statistics</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.length === 0 ? (<p className="text-gray-500">Add subjects to see statistics</p>) : (subjects.map((subject) => {
                const attended = Object.values(attendance).filter(r => r.subject === subject && r.status === 'attended').reduce((sum, r) => sum + r.duration, 0);
                const notAttended = Object.values(attendance).filter(r => r.subject === subject && r.status === 'not-attended').reduce((sum, r) => sum + r.duration, 0);
                const cancelled = Object.values(attendance).filter(r => r.subject === subject && r.status === 'cancelled').reduce((sum, r) => sum + r.duration, 0);
                const total = attended + notAttended + cancelled;
                const percentage = total > 0 ? ((attended / total) * 100).toFixed(1) : 0;
                return (
                  <div key={subject} className="border border-gray-300 rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3 text-gray-800">{subject}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-green-600 font-semibold">Attended:</span><span>{attended}h</span></div>
                      <div className="flex justify-between"><span className="text-red-600 font-semibold">Not Attended:</span><span>{notAttended}h</span></div>
                      <div className="flex justify-between"><span className="text-gray-600 font-semibold">Cancelled:</span><span>{cancelled}h</span></div>
                      <div className="pt-2 border-t border-gray-300">
                        <div className="flex justify-between font-bold">
                          <span>Attendance %:</span>
                          <span className={percentage >= 75 ? 'text-green-600' : 'text-red-600'}>{percentage}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}