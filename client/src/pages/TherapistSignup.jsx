import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Stethoscope, MapPin, DollarSign, Briefcase } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function TherapistSignup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    specialty: '',
    experience: '',
    location: 'Remote',
    price: 100,
  });
  const [error, setError] = useState('');
  const { login } = useApp();
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password || !formData.specialty) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${API_BASE_URL}/api/auth/therapist/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const msg = (await res.json())?.error || 'Signup failed';
        setError(msg);
        return;
      }

      const json = await res.json();
      const { user: userData, token } = json;
      login(userData, token);
      navigate('/therapist-portal?signup=1');
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, #fafafa 0%, #ffffff 100%)',
      padding: '2rem',
      overflow: 'hidden',
    }}>
      {/* Background decorations */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.03) 1px, transparent 0)',
        backgroundSize: '40px 40px',
        opacity: 0.5,
      }} />

      <div className="card auth-form-card" style={{
        width: '100%',
        maxWidth: '550px',
        padding: 'clamp(1.5rem, 4vw, 3rem)',
        opacity: isLoaded ? 1 : 0,
        transform: isLoaded ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 800,
            marginBottom: '0.5rem',
            color: 'var(--color-foreground)',
          }}>Join as a Therapist</h1>
          <p style={{
            color: 'var(--color-muted-foreground)',
            fontSize: '1rem',
          }}>Create your professional profile</p>
        </div>

        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.875rem 1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '0.5rem',
              color: '#ef4444',
              fontSize: '0.875rem',
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="name" style={{
              color: 'var(--color-foreground)',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}>Full Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Dr. Jane Smith"
              required
              style={{
                padding: '0.75rem 1rem',
                background: 'var(--color-background)',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
                fontSize: '0.95rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="email" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--color-foreground)',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}>
              <Mail size={16} />
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="jane@example.com"
              required
              style={{
                padding: '0.75rem 1rem',
                background: 'var(--color-background)',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
                fontSize: '0.95rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="password" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--color-foreground)',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}>
              <Lock size={16} />
              Password *
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              style={{
                padding: '0.75rem 1rem',
                background: 'var(--color-background)',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
                fontSize: '0.95rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="specialty" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--color-foreground)',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}>
              <Stethoscope size={16} />
              Specialty *
            </label>
            <input
              id="specialty"
              name="specialty"
              type="text"
              value={formData.specialty}
              onChange={handleChange}
              placeholder="e.g., Anxiety & Depression, PTSD"
              required
              style={{
                padding: '0.75rem 1rem',
                background: 'var(--color-background)',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
                fontSize: '0.95rem',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="experience" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--color-foreground)',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}>
                <Briefcase size={16} />
                Experience
              </label>
              <input
                id="experience"
                name="experience"
                type="text"
                value={formData.experience}
                onChange={handleChange}
                placeholder="10 years"
                style={{
                  padding: '0.75rem 1rem',
                  background: 'var(--color-background)',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="price" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--color-foreground)',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}>
                <DollarSign size={16} />
                Price/Session
              </label>
              <input
                id="price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                min="0"
                style={{
                  padding: '0.75rem 1rem',
                  background: 'var(--color-background)',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="location" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--color-foreground)',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}>
              <MapPin size={16} />
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
              placeholder="Remote"
              style={{
                padding: '0.75rem 1rem',
                background: 'var(--color-background)',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
                fontSize: '0.95rem',
              }}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            Create Therapist Account
          </button>
        </form>

        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          color: 'var(--color-muted-foreground)',
          fontSize: '0.875rem',
        }}>
          <p>Already have an account? <Link to="/therapist/login" style={{ color: 'var(--color-foreground)', fontWeight: 600 }}>Sign in</Link></p>
          <Link to="/" style={{
            display: 'block',
            marginTop: '1rem',
            color: 'var(--color-muted-foreground)',
            textDecoration: 'none',
          }}>← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
