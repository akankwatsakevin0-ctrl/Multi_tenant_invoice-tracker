// =============================================================================
// Delete Account Button — GDPR Right to Erasure
// =============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../hooks/useTranslation';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

export const DeleteAccountButton: React.FC = () => {
  const t = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Simulate API call to delete account
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('preferred_currency');
      localStorage.removeItem('preferred_language');

      toast.success('Account deleted successfully.');
      logout();
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account.');
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-red-200 hover:border-red-300 hover:bg-red-50/50 transition-all group"
      >
        <div className="p-2 rounded-lg bg-red-50 text-red-600 group-hover:bg-red-100 transition-colors">
          <Trash2 className="h-5 w-5" />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-red-700 group-hover:text-red-800 transition-colors">
            {t.profile.deleteAccount}
          </p>
          <p className="text-xs text-red-500">{t.profile.deleteAccountDesc}</p>
        </div>
        <AlertTriangle className="h-4 w-4 text-red-400 ml-auto" />
      </button>

      {/* Confirmation Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          if (!deleting) {
            setModalOpen(false);
            setConfirmText('');
          }
        }}
        title={t.profile.deleteAccount}
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-50 border border-red-100">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  {t.profile.deleteConfirm}
                </p>
                <p className="text-xs text-red-600 mt-1 font-semibold">
                  {t.profile.deleteWarning}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Type <span className="font-bold text-red-600">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900
                placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                setConfirmText('');
              }}
              disabled={deleting}
            >
              {t.common.cancel}
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={confirmText !== 'DELETE'}
              loading={deleting}
              icon={<Trash2 className="h-4 w-4" />}
            >
              {t.profile.deleteAccount}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
