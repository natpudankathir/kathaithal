import React, { useState } from 'react';
import { X, Users, UserPlus, LogOut, Check, Edit2 } from 'lucide-react';
import { Conversation, User } from '../../types';
import { FirestoreService, SoundService } from '../../services/firebase';
import { maskEmail } from '../../utils/mask';

interface GroupDetailsModalProps {
  conversation: Conversation;
  currentUser: User;
  onClose: () => void;
  onLeaveGroup: () => void;
}

export const GroupDetailsModal: React.FC<GroupDetailsModalProps> = ({
  conversation,
  currentUser,
  onClose,
  onLeaveGroup
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(conversation.groupName || '');
  const [savingName, setSavingName] = useState(false);

  const handleAddMember = async () => {
    if (!newEmail.trim()) return;
    setAddError('');
    setAddSuccess('');
    setAdding(true);
    SoundService.playButtonClick();

    try {
      const email = newEmail.trim().toLowerCase();
      const foundUser = await FirestoreService.searchUserByEmail(email);

      if (!foundUser) {
        setAddError('User not found with this email');
        SoundService.playError();
        return;
      }

      if (conversation.participants.includes(foundUser.uid)) {
        setAddError('This user is already a group member');
        SoundService.playError();
        return;
      }

      await FirestoreService.addParticipantsToGroup(conversation.id, [foundUser.uid]);
      conversation.participants.push(foundUser.uid);
      conversation.participantDetails.push(foundUser);

      setAddSuccess(`Added ${foundUser.displayName || maskEmail(foundUser.email)}!`);
      setNewEmail('');
      SoundService.playComplexNotification();
    } catch (err: any) {
      console.error('Error adding member:', err);
      setAddError('Failed to add member');
      SoundService.playError();
    } finally {
      setAdding(false);
    }
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) return;
    setSavingName(true);
    SoundService.playButtonClick();

    try {
      await FirestoreService.updateGroupName(conversation.id, editedName.trim());
      conversation.groupName = editedName.trim();
      setIsEditingName(false);
    } catch (err: any) {
      console.error('Error updating group name:', err);
      SoundService.playError();
    } finally {
      setSavingName(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    SoundService.playButtonClick();

    try {
      await FirestoreService.removeParticipantFromGroup(conversation.id, currentUser.uid);
      onLeaveGroup();
    } catch (err: any) {
      console.error('Error leaving group:', err);
      SoundService.playError();
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
              <h2 className="text-lg font-bold">குழு விவரங்கள் • Group Info</h2>
              <p className="text-xs text-primary-100">
                {conversation.participants.length} உறுப்பினர்கள் • Members
              </p>
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

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Group Name Section */}
          <div className="bg-primary-50/50 border border-primary-100 p-3 rounded-xl">
            <label className="block text-[11px] font-semibold text-secondary-600 mb-1">
              குழுவின் பெயர் • Group Name
            </label>
            {isEditingName ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-primary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  disabled={savingName || !editedName.trim()}
                  className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-xs"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-secondary-800">
                  {conversation.groupName || 'குழு • Group'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="p-1.5 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors text-xs flex items-center space-x-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Rename</span>
                </button>
              </div>
            )}
          </div>

          {/* Add Member by Email */}
          <div>
            <label className="block text-xs font-semibold text-secondary-700 mb-1">
              புதிய உறுப்பினர் சேர்க்க • Add Member
            </label>
            <div className="flex space-x-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMember();
                  }
                }}
                placeholder="Enter Gmail address..."
                className="flex-1 px-3 py-2 border border-primary-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm"
              />
              <button
                type="button"
                onClick={handleAddMember}
                disabled={adding || !newEmail.trim()}
                className="px-3 py-2 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 text-xs flex items-center space-x-1"
              >
                <UserPlus className="w-4 h-4" />
                <span>{adding ? '...' : 'Add'}</span>
              </button>
            </div>
            {addError && <p className="text-xs text-red-500 mt-1">{addError}</p>}
            {addSuccess && <p className="text-xs text-green-600 mt-1">{addSuccess}</p>}
          </div>

          {/* Members List */}
          <div>
            <label className="block text-xs font-semibold text-secondary-700 mb-2">
              உறுப்பினர்கள் • Members ({conversation.participantDetails.length})
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-primary-100 rounded-xl p-2 bg-white">
              {conversation.participantDetails.map((member) => {
                const isCurrentUser = member.uid === currentUser.uid;
                return (
                  <div
                    key={member.uid}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-primary-50/50 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      {member.photoURL ? (
                        <img
                          src={member.photoURL}
                          alt={member.displayName}
                          className="w-8 h-8 rounded-full border border-primary-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center">
                          {member.displayName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">
                          {member.displayName} {isCurrentUser && '(You)'}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">{maskEmail(member.email)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-100">
          <button
            type="button"
            onClick={handleLeave}
            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave Group</span>
          </button>
          <button
            type="button"
            onClick={() => {
              SoundService.playButtonClick();
              onClose();
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-semibold hover:bg-primary-700 shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
