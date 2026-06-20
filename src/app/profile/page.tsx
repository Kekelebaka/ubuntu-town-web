'use client';
import { useState } from 'react';
import { User, Mail, MapPin, Phone, Edit3, Save, X, Camera, Award, Users, Briefcase } from 'lucide-react';

interface ProfileData {
  displayName: string;
  email: string;
  phone: string;
  town: string;
  bio: string;
  role: string;
  avatar: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({
    displayName: 'Keke Lebaka',
    email: 'keke@example.com',
    phone: '+27 12 345 6789',
    town: 'Mafikeng',
    bio: 'Building Ubuntu Town across South Africa. Connecting communities with opportunities through technology.',
    role: 'coordinator',
    avatar: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editProfile, setEditProfile] = useState(profile);
  const [activeTab, setActiveTab] = useState('profile');

  const handleEdit = () => {
    setEditProfile(profile);
    setIsEditing(true);
  };

  const handleSave = () => {
    setProfile(editProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const stats = [
    { label: 'Towns', value: '5', icon: MapPin },
    { label: 'Signals', value: '23', icon: Award },
    { label: 'Opportunities', value: '47', icon: Briefcase },
    { label: 'Coordinators', value: '12', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-ubuntu-dark text-ubuntu-light">
      {/* Header */}
      <div className="border-b border-ubuntu-border bg-ubuntu-card/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-ubuntu-light">Profile</h1>
          <p className="text-muted-foreground">Manage your Ubuntu Town profile</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-6">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-ubuntu-orange to-ubuntu-purple flex items-center justify-center mb-4 relative">
                  <User className="w-12 h-12 text-white" />
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-ubuntu-dark border border-ubuntu-border rounded-full flex items-center justify-center hover:border-ubuntu-orange transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <h2 className="text-xl font-bold text-ubuntu-light">{profile.displayName}</h2>
                <p className="text-sm text-muted-foreground">@{profile.town}</p>
                <div className="mt-4">
                  <span className="text-xs bg-ubuntu-purple/20 text-ubuntu-purple px-3 py-1 rounded-full">
                    {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                {stats.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="text-center">
                    <div className="text-2xl font-bold text-ubuntu-light">{value}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <div className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-4">
                  {['Profile', 'Activity', 'Settings'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab.toLowerCase())}
                      className={`text-sm font-medium pb-2 transition-colors ${
                        activeTab === tab.toLowerCase()
                          ? 'text-ubuntu-orange border-b-2 border-ubuntu-orange'
                          : 'text-muted-foreground hover:text-ubuntu-light'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <button
                  onClick={isEditing ? handleSave : handleEdit}
                  className="bg-ubuntu-orange text-ubuntu-dark rounded-lg px-4 py-2 font-semibold hover:bg-ubuntu-orange/90 transition-colors flex items-center gap-2"
                >
                  {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  {isEditing ? 'Save' : 'Edit'}
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Display Name</label>
                      <input
                        type="text"
                        value={editProfile.displayName}
                        onChange={(e) => setEditProfile({ ...editProfile, displayName: e.target.value })}
                        className="w-full bg-ubuntu-dark border border-ubuntu-border rounded-lg px-3 py-2 text-ubuntu-light focus:outline-none focus:border-ubuntu-orange"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Email</label>
                      <input
                        type="email"
                        value={editProfile.email}
                        onChange={(e) => setEditProfile({ ...editProfile, email: e.target.value })}
                        className="w-full bg-ubuntu-dark border border-ubuntu-border rounded-lg px-3 py-2 text-ubuntu-light focus:outline-none focus:border-ubuntu-orange"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Phone</label>
                      <input
                        type="tel"
                        value={editProfile.phone}
                        onChange={(e) => setEditProfile({ ...editProfile, phone: e.target.value })}
                        className="w-full bg-ubuntu-dark border border-ubuntu-border rounded-lg px-3 py-2 text-ubuntu-light focus:outline-none focus:border-ubuntu-orange"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Town</label>
                      <input
                        type="text"
                        value={editProfile.town}
                        onChange={(e) => setEditProfile({ ...editProfile, town: e.target.value })}
                        className="w-full bg-ubuntu-dark border border-ubuntu-border rounded-lg px-3 py-2 text-ubuntu-light focus:outline-none focus:border-ubuntu-orange"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Bio</label>
                    <textarea
                      value={editProfile.bio}
                      onChange={(e) => setEditProfile({ ...editProfile, bio: e.target.value })}
                      className="w-full h-24 bg-ubuntu-dark border border-ubuntu-border rounded-lg px-3 py-2 text-ubuntu-light focus:outline-none focus:border-ubuntu-orange resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="bg-ubuntu-purple text-white rounded-lg px-4 py-2 hover:bg-ubuntu-purple/90 transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancel}
                      className="text-muted-foreground hover:text-ubuntu-light transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Email</div>
                        <div className="text-ubuntu-light">{profile.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Phone</div>
                        <div className="text-ubuntu-light">{profile.phone}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Town</div>
                        <div className="text-ubuntu-light">{profile.town}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Role</div>
                        <div className="text-ubuntu-light capitalize">{profile.role}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm text-muted-foreground mb-2">Bio</h3>
                    <p className="text-ubuntu-light">{profile.bio}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
