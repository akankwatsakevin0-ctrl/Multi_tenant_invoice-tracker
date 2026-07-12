import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Receipt, Mail, Lock, Building2, Eye, EyeOff } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    tenant_name: '',
    tenant_currency: 'USD',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.email.trim()) newErrors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'Invalid email format.';

    if (!form.password) newErrors.password = 'Password is required.';
    else if (form.password.length < 8)
      newErrors.password = 'Password must be at least 8 characters.';

    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match.';

    if (!form.tenant_name.trim()) newErrors.tenant_name = 'Company name is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await register(form.email, form.password, form.tenant_name, form.tenant_currency);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary-600 text-white rounded-2xl shadow-lg mb-4">
            <Receipt className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">InvoiceTrack</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create your account and company
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Company Name"
              placeholder="Acme Corporation"
              value={form.tenant_name}
              onChange={(e) => updateField('tenant_name', e.target.value)}
              error={errors.tenant_name}
              icon={<Building2 className="h-4 w-4" />}
            />

            <Select
              label="Default Currency"
              options={[
                { value: 'USD', label: 'USD - US Dollar' },
                { value: 'EUR', label: 'EUR - Euro' },
              ]}
              value={form.tenant_currency}
              onChange={(e) => updateField('tenant_currency', e.target.value)}
            />

            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              error={errors.email}
              icon={<Mail className="h-4 w-4" />}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                error={errors.password}
                icon={<Lock className="h-4 w-4" />}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              error={errors.confirmPassword}
              icon={<Lock className="h-4 w-4" />}
            />

            <Button type="submit" className="w-full" size="lg" loading={isLoading}>
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
