'use client';
import { useState } from 'react';
import { FileText, Download, Plus, Edit3, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

interface CVSection {
  title: string;
  content: string;
  isComplete: boolean;
}

export default function CVBuilderPage() {
  const [cvSections, setCvSections] = useState<CVSection[]>([
    {
      title: 'Personal Information',
      content: 'Name: Your Full Name\nLocation: Your Town/City\nPhone: Your Phone Number\nEmail: your.email@example.com',
      isComplete: false,
    },
    {
      title: 'Career Objective',
      content: 'Write a brief statement about your career goals and what you want to achieve.',
      isComplete: false,
    },
    {
      title: 'Education',
      content: 'School/University: Name of Institution\nQualification: What you studied\nYear: Year of completion\nGrade/Average: Your academic performance',
      isComplete: false,
    },
    {
      title: 'Work Experience',
      content: 'Position: Your Job Title\nCompany: Where you worked\nDuration: Start - End dates\nResponsibilities: What you did',
      isComplete: false,
    },
    {
      title: 'Skills',
      content: 'Technical: Computer skills, languages, certifications\nSoft: Communication, teamwork, leadership\nOther: Any additional skills',
      isComplete: false,
    },
    {
      title: 'References',
      content: 'Reference 1: Name, Title, Contact\nReference 2: Name, Title, Contact\nReference 3: Name, Title, Contact',
      isComplete: false,
    },
  ]);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditContent(cvSections[index].content);
  };

  const handleSave = () => {
    const newSections = [...cvSections];
    newSections[editingIndex!] = {
      ...newSections[editingIndex!],
      content: editContent,
      isComplete: editContent.trim().length > 20,
    };
    setCvSections(newSections);
    setEditingIndex(null);
    setEditContent('');
  };

  const handleDelete = (index: number) => {
    if (confirm('Delete this section?')) {
      setCvSections(cvSections.filter((_, i) => i !== index));
    }
  };

  const handleAddSection = () => {
    const title = prompt('Enter section title:');
    if (title) {
      setCvSections([...cvSections, {
        title,
        content: '',
        isComplete: false,
      }]);
    }
  };

  const getCompletionPercentage = () => {
    const complete = cvSections.filter(s => s.isComplete).length;
    return Math.round((complete / cvSections.length) * 100);
  };

  const handleDownload = () => {
    const content = cvSections.map(s => `## ${s.title}\n\n${s.content}`).join('\n\n');
    const blob = new Blob([`# CV - ${new Date().toLocaleDateString()}\n\n${content}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cv-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-ubuntu-cream text-ubuntu-text">
      {/* Header */}
      <div className="border-b border-ubuntu-border bg-ubuntu-card/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-ubuntu-text">CV Builder</h1>
              <p className="text-muted-foreground">Build your professional CV with guided sections</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-ubuntu-orange">{getCompletionPercentage()}%</div>
                <div className="text-xs text-muted-foreground">Complete</div>
              </div>
              <div className="w-32 h-2 bg-ubuntu-cream rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-ubuntu-orange to-ubuntu-purple transition-all duration-500"
                  style={{ width: `${getCompletionPercentage()}%` }}
                />
              </div>
              <button
                onClick={handleDownload}
                className="bg-ubuntu-orange text-ubuntu-dark rounded-lg px-4 py-2 font-semibold hover:bg-ubuntu-orange/90 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Section List */}
          <div className="lg:col-span-1">
            <div className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-ubuntu-text">Sections</h2>
                <button
                  onClick={handleAddSection}
                  className="text-ubuntu-orange hover:text-ubuntu-orange/80 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2">
                {cvSections.map((section, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      section.isComplete
                        ? 'border-ubuntu-purple/30 bg-ubuntu-purple/10'
                        : 'border-ubuntu-border hover:border-ubuntu-orange'
                    }`}
                    onClick={() => handleEdit(index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {section.isComplete ? (
                          <CheckCircle className="w-4 h-4 text-ubuntu-purple" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="text-sm">{section.title}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(index);
                        }}
                        className="text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Editor */}
          <div className="lg:col-span-2">
            {editingIndex !== null ? (
              <div className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-ubuntu-text">{cvSections[editingIndex].title}</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingIndex(null)}
                      className="text-muted-foreground hover:text-ubuntu-text transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="bg-ubuntu-purple text-white rounded-lg px-4 py-2 hover:bg-ubuntu-purple/90 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-96 bg-ubuntu-cream border border-ubuntu-border rounded-lg p-4 text-ubuntu-text placeholder:text-muted-foreground resize-none focus:outline-none focus:border-ubuntu-orange"
                  placeholder={`Enter your ${cvSections[editingIndex].title.toLowerCase()} here...`}
                />
                <div className="mt-2 text-xs text-muted-foreground">
                  {editContent.length} characters
                </div>
              </div>
            ) : (
              <div className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-ubuntu-orange" />
                  <h2 className="text-xl font-bold text-ubuntu-text">CV Preview</h2>
                </div>
                <div className="space-y-4">
                  {cvSections.map((section, index) => (
                    <div key={index} className="border-b border-ubuntu-border pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        {section.isComplete ? (
                          <CheckCircle className="w-4 h-4 text-ubuntu-purple" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-muted-foreground" />
                        )}
                        <h3 className="font-semibold text-ubuntu-text">{section.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{section.content || 'No content yet...'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
