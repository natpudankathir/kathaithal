import React, { useState } from 'react';
import { X, Users, Search, Plus, Check } from 'lucide-react';
import { User } from '../../types';
import { FirestoreService, SoundService } from '../../services/firebase';
import { maskEmail } from '../../utils/mask';

interface CreateGroupModalProps {
  currentUser: User;
  availableUsers: User[];
  onClose: () => void;
  onGroupCreated: (conversationId: string) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  currentUser,
  availableUsers,
  onClose,
  onGroupCreated
}) => {
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [allUsersList, setAllUsersList] = useState<User[]>(availableUsers);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const toggleSelectUser = (uid: string) => {
    SoundService.playButtonClick();
    setSelectedUserIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleSearchAndAddEmail = async () => {
    if (!searchEmail.trim()) return;
    setSearchError('');
    setSearching(true);
    SoundService.playButtonClick();

    try {
      const email = searchEmail.trim();
      if (email.toLowerCase() === currentUser.email?.toLowerCase()) {
        setSearchError("You are already included in the group");
        SoundService.playError();
        return;
      }

      const existing = allUsersList.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );
      if (existing) {
        if (!selectedUserIds.includes(existing.uid)) {
          setSelectedUserIds((prev) => [...prev, existing.uid]);
        }
        setSearchEmail('');
        return;
      }

      const foundUser = await FirestoreService.searchUserByEmail(email);
      if (!foundUser) {
        setSearchError('User not found with this email');
        SoundService.playError();
        return;
      }

      setAllUsersList((prev) => [...prev, foundUser]);
      setSelectedUserIds((prev) => [...prev, foundUser.uid]);
      setSearchEmail('');
    } catch (err: any) {
      console.error('Error searching user:', err);
      setSearchError('Failed to search user');
      SoundService.playError();
    } finally {
      setSearching(false);
    }
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError('Please enter a group name');
      SoundService.playError();
      return;
    }
    if (selectedUserIds.length === 0) {
      setError('Please select at least one member');
      SoundService.playError();
      return;
    }

    setError('');
    setCreating(true);
    SoundService.playButtonClick();

    try {
      const conversationId = await FirestoreService.createGroupConversation(
        groupName.trim(),
        selectedUserIds,
        currentUser.uid
      );
      SoundService.playComplexNotification();
      onGroupCreated(conversationId);
      onClose();
    } catch (err: any) {
      console.error('Error creating group:', err);
      setError('Failed to create group. Please try again.');
      SoundService.playError();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-primary-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">புதிய குழு • New Group</h2>
              <p className="text-xs text-primary-100">கதைப்போமா? Create group chat</p>
            </div>
          </div>
          <button
            onClick={() => {
              SoundService.playButtonClick();
              onClose();
            }}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Group Name input */}
          <div>
            <label className="block text-xs font-semibold text-secondary-700 mb-1">
              குழுவின் பெயர் • Group Name *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. குடும்பம், நண்பர்கள் (Family, Friends)..."
              className="w-full px-4 py-2.5 border border-primary-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm transition-all"
              autoFocus
            />
          </div>

          {/* Add member by email */}
          <div>
            <label className="block text-xs font-semibold text-secondary-700 mb-1">
              மின்னஞ்சல் மூலம் சேர்க்க • Add by Email
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchAndAddEmail();
                    }
                  }}
                  placeholder="Enter Gmail address..."
                  className="w-full pl-9 pr-3 py-2 border border-primary-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleSearchAndAddEmail}
                disabled={searching || !searchEmail.trim()}
                className="px-3 py-2 bg-primary-100 text-primary-700 font-medium rounded-xl hover:bg-primary-200 disabled:opacity-50 text-xs flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>{searching ? '...' : 'Add'}</span>
              </button>
            </div>
            {searchError && (
              <p className="text-xs text-red-500 mt-1">{searchError}</p>
            )}
          </div>

          {/* Available Members Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-secondary-700">
                உறுப்பினர்களைத் தேர்வுசெய்க • Select Members ({selectedUserIds.length})
              </label>
            </div>

            {allUsersList.length === 0 ? (
              <p className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded-xl text-center">
                No contacts found yet. Use email search above to add friends.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto border border-primary-100 rounded-xl p-2 bg-primary-50/30">
                {allUsersList.map((usr) => {
                  const isSelected = selectedUserIds.includes(usr.uid);
                  return (
                    <button
                      key={usr.uid}
                      type="button"
                      onClick={() => toggleSelectUser(usr.uid)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all ${
                        isSelected
                          ? 'bg-primary-100 border border-primary-300 shadow-xs'
                          : 'hover:bg-white border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        {usr.photoURL ? (
                          <img
                            src={usr.photoURL}
                            alt={usr.displayName}
                            className="w-8 h-8 rounded-full border border-primary-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center">
                            {usr.displayName?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">
                            {usr.displayName}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate">
                            {maskEmail(usr.email)}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          isSelected
                            ? 'bg-primary-600 border-primary-600 text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              SoundService.playButtonClick();
              onClose();
            }}
            className="px-4 py-2 text-sm text-secondary-600 hover:text-secondary-800 font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || !groupName.trim() || selectedUserIds.length === 0}
            className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl text-sm font-semibold hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 shadow-md transition-all"
          >
            {creating ? 'Creating...' : 'கதைப்போமா? Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
};
