import React, { useState } from 'react';
import {
  AlertTriangle,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { EmptyState } from '../components/common/EmptyState';

export function ProfilePage() {
  const { currentUser, isAuthenticated, updateProfile, changePassword, deleteAccount, openAuthModal } =
    useAuth();
  const { showToast } = useToast();

  // Profile Form state
  const [username, setUsername] = useState(currentUser?.username || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [city, setCity] = useState(currentUser?.city || '');
  const [state, setState] = useState(currentUser?.state || '');
  const [country, setCountry] = useState(currentUser?.country || 'India');
  const [zipCode, setZipCode] = useState(currentUser?.zipCode || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Delete modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="py-12">
        <EmptyState
          icon={UserIcon}
          title="Sign In to Manage Your Account"
          description="Log in to manage your delivery address, personal details, and account security."
          actionText="Sign In"
          onAction={() => openAuthModal('login')}
        />
      </div>
    );
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({
        username: username.trim(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
        zipCode: zipCode.trim(),
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters.', 'error');
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'Failed to change password.', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
    } catch (err: any) {
      showToast(err.message || 'Unable to delete account.', 'error');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header Profile Summary Card */}
      <div className="bg-white rounded-2xl border border-[#E1E5E9] p-6 shadow-2xs flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center uppercase shadow-sm">
          {currentUser.username?.[0] || 'U'}
        </div>
        <div className="text-center sm:text-left space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-xl font-bold text-[#17202A]">{currentUser.username}</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-[#5F6368]">
              Role: {currentUser.role}
            </span>
          </div>
          <p className="text-xs text-[#5F6368]">{currentUser.email}</p>
          <p className="text-[11px] text-[#8A9199]">
            Member since{' '}
            {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : '2026'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Profile Information & Shipping Defaults */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-[#E1E5E9] p-6 shadow-2xs">
            <div className="flex items-center gap-2 pb-4 border-b border-[#E1E5E9] mb-4">
              <UserIcon className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-[#17202A]">Personal & Address Details</h2>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#17202A] mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#17202A] mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#17202A] mb-1">
                  Default Shipping Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Flat/House, Street, Area"
                  className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-semibold text-[#17202A] mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-semibold text-[#17202A] mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#17202A] mb-1">PIN / Zip</label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#17202A] mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingProfile ? 'Saving Changes...' : 'Save Profile Details'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Col: Security & Danger Zone */}
        <div className="space-y-6">
          {/* Password Form */}
          <div className="bg-white rounded-xl border border-[#E1E5E9] p-5 shadow-2xs">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E1E5E9] mb-3">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-[#17202A]">Update Password</h2>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#17202A] mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#17202A] mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full px-3 py-1.5 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#17202A] mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg transition-colors text-xs disabled:opacity-50"
              >
                {savingPassword ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          </div>

          {/* Delete Account */}
          <div className="bg-rose-50/50 rounded-xl border border-rose-200 p-5 space-y-3">
            <div className="flex items-center gap-2 text-rose-800">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Danger Zone</h3>
            </div>
            <p className="text-[11px] text-rose-700 leading-relaxed">
              Permanently delete your Zyphora account and associated profile data. This action is irreversible.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-colors text-xs flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E1E5E9] max-w-sm w-full p-6 space-y-4 shadow-xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17202A]">Confirm Account Deletion</h3>
              <p className="text-xs text-[#5F6368] mt-1">
                Are you sure you want to delete your Zyphora profile? This will immediately remove your credentials.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 border border-[#E1E5E9] rounded-lg text-xs font-semibold text-[#17202A] hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
