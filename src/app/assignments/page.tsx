'use client';
import { useState } from 'react';
import { ClipboardList, CheckCircle, Clock, AlertCircle, Plus, Trash2, Edit3, Filter } from 'lucide-react';

type AssignmentStatus = 'pending' | 'in-progress' | 'completed';

interface Assignment {
  id: string;
  title: string;
  description: string;
  town: string;
  priority: 'low' | 'medium' | 'high';
  status: AssignmentStatus;
  dueDate: string;
  category: string;
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([
    {
      id: '1',
      title: 'Visit Mafikeng venues',
      description: 'Conduct Ubuntu Access Standard assessment for 3 venues',
      town: 'Mafikeng',
      priority: 'high',
      status: 'in-progress',
      dueDate: '2025-01-31',
      category: 'Venue Assessment',
    },
    {
      id: '2',
      title: 'CV Workshop',
      description: 'Organize CV writing workshop for youth',
      town: 'Polokwane',
      priority: 'medium',
      status: 'pending',
      dueDate: '2025-02-15',
      category: 'Community Event',
    },
    {
      id: '3',
      title: 'Signal Response',
      description: 'Address community signal about road maintenance',
      town: 'Johannesburg',
      priority: 'high',
      status: 'pending',
      dueDate: '2025-01-25',
      category: 'Signal Response',
    },
    {
      id: '4',
      title: 'Opportunity Database Update',
      description: 'Update opportunities database with new listings',
      town: 'Cape Town',
      priority: 'low',
      status: 'completed',
      dueDate: '2025-01-20',
      category: 'Data Management',
    },
    {
      id: '5',
      title: 'Coordinator Training',
      description: 'Train new coordinators on Ubuntu Town tools',
      town: 'Durban',
      priority: 'medium',
      status: 'pending',
      dueDate: '2025-02-28',
      category: 'Training',
    },
  ]);

  const [filter, setFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTown, setNewTown] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newCategory, setNewCategory] = useState('General');

  const filteredAssignments = assignments.filter(a =>
    filter === 'all' || a.status === filter
  );

  const statusCounts = {
    all: assignments.length,
    pending: assignments.filter(a => a.status === 'pending').length,
    'in-progress': assignments.filter(a => a.status === 'in-progress').length,
    completed: assignments.filter(a => a.status === 'completed').length,
  };

  const handleStatusChange = (id: string, newStatus: AssignmentStatus) => {
    setAssignments(assignments.map(a =>
      a.id === id ? { ...a, status: newStatus } : a
    ));
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this assignment?')) {
      setAssignments(assignments.filter(a => a.id !== id));
    }
  };

  const handleAddAssignment = () => {
    if (!newTitle.trim() || !newTown.trim()) return;
    
    const newAssignment: Assignment = {
      id: Date.now().toString(),
      title: newTitle,
      description: newDescription,
      town: newTown,
      priority: newPriority,
      status: 'pending',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: newCategory,
    };
    
    setAssignments([...assignments, newAssignment]);
    setShowForm(false);
    setNewTitle('');
    setNewDescription('');
    setNewTown('');
    setNewPriority('medium');
    setNewCategory('General');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'in-progress': return 'bg-ubuntu-orange/20 text-ubuntu-orange border-ubuntu-orange/30';
      default: return 'bg-ubuntu-purple/20 text-ubuntu-purple border-ubuntu-purple/30';
    }
  };

  return (
    <div className="min-h-screen bg-ubuntu-dark text-ubuntu-light">
      {/* Header */}
      <div className="border-b border-ubuntu-border bg-ubuntu-card/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-ubuntu-light">Assignments</h1>
              <p className="text-muted-foreground">Manage your town tasks and responsibilities</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-ubuntu-orange text-ubuntu-dark rounded-lg px-4 py-2 font-semibold hover:bg-ubuntu-orange/90 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Assignment
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-ubuntu-light mb-4">New Assignment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-ubuntu-dark border border-ubuntu-border rounded-lg px-3 py-2 text-ubuntu-light focus:outline-none focus:border-ubuntu-orange"
                  placeholder="Assignment title"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Town *</label>
                <input
                  type="text"
                  value={newTown}
                  onChange={(e) => setNewTown(e.target.value)}
                  className="w-full bg-ubuntu-dark border border-ubuntu-border rounded-lg px-3 py-2 text-ubuntu-light focus:outline-none focus:border-ubuntu-orange"
                  placeholder="Town name"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-muted-foreground mb-1">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full h-24 bg-ubuntu-dark border border-ubuntu-border rounded-lg px-3 py-2 text-ubuntu-light focus:outline-none focus:border-ubuntu-orange resize-none"
                  placeholder="What needs to be done?"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full bg-ubuntu-dark border border-ubuntu-border rounded-lg px-3 py-2 text-ubuntu-light focus:outline-none focus:border-ubuntu-orange"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-ubuntu-dark border border-ubuntu-border rounded-lg px-3 py-2 text-ubuntu-light focus:outline-none focus:border-ubuntu-orange"
                >
                  <option value="General">General</option>
                  <option value="Venue Assessment">Venue Assessment</option>
                  <option value="Community Event">Community Event</option>
                  <option value="Signal Response">Signal Response</option>
                  <option value="Data Management">Data Management</option>
                  <option value="Training">Training</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddAssignment}
                className="bg-ubuntu-purple text-white rounded-lg px-4 py-2 hover:bg-ubuntu-purple/90 transition-colors"
              >
                Create Assignment
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="text-muted-foreground hover:text-ubuntu-light transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', key: 'all', color: 'text-ubuntu-light' },
            { label: 'Pending', key: 'pending', color: 'text-ubuntu-purple' },
            { label: 'In Progress', key: 'in-progress', color: 'text-ubuntu-orange' },
            { label: 'Completed', key: 'completed', color: 'text-green-500' },
          ].map(({ label, key, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`p-4 rounded-xl border transition-all ${
                filter === key
                  ? 'border-ubuntu-orange bg-ubuntu-orange/10'
                  : 'border-ubuntu-border hover:border-ubuntu-orange'
              }`}
            >
              <div className={`text-2xl font-bold ${color}`}>{statusCounts[key as keyof typeof statusCounts]}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </button>
          ))}
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-6 hover:border-ubuntu-orange/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-ubuntu-light">{assignment.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(assignment.status)}`}>
                      {assignment.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{assignment.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ClipboardList className="w-3 h-3" />
                      {assignment.town}
                    </span>
                    <span className={`flex items-center gap-1 ${getPriorityColor(assignment.priority)}`}>
                      <Clock className="w-3 h-3" />
                      {assignment.priority}
                    </span>
                    <span>Due: {assignment.dueDate}</span>
                    <span>{assignment.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={assignment.status}
                    onChange={(e) => handleStatusChange(assignment.id, e.target.value as AssignmentStatus)}
                    className="bg-ubuntu-dark border border-ubuntu-border rounded-lg px-2 py-1 text-xs text-ubuntu-light focus:outline-none focus:border-ubuntu-orange"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button
                    onClick={() => handleDelete(assignment.id)}
                    className="text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
