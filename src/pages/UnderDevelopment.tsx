import { useState, useEffect } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Plus, Trash2, Edit2, Save, X, StickyNote, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface Note {
  id: string
  userid: string
  title: string
  content: string
  createdat: string
  updatedat: string
}

export const NotesPage = () => {
  const { user: authUser } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [form, setForm] = useState({ title: '', content: '' })
  const [saving, setSaving] = useState(false)

  // Fetch notes from Supabase
  const fetchNotes = async () => {
    if (!authUser) return
    setLoading(true)
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('userid', authUser.id)
      .order('createdat', { ascending: false })
    if (!error && Array.isArray(data)) setNotes(data)
    setLoading(false)
  }

  useEffect(() => { fetchNotes() }, [authUser])

  // Add or update note
  const handleSave = async () => {
    if (!authUser) return
    setSaving(true)
    if (editingNote) {
      // Update
      const { error } = await supabase
        .from('notes')
        .update({
          title: form.title,
          content: form.content,
          updatedat: new Date().toISOString(),
        })
        .eq('id', editingNote.id)
        .eq('userid', authUser.id)
      if (!error) {
        setShowForm(false)
        setEditingNote(null)
        setForm({ title: '', content: '' })
        fetchNotes()
      }
    } else {
      // Add
      const { error } = await supabase
        .from('notes')
        .insert({
          title: form.title,
          content: form.content,
          userid: authUser.id,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString(),
        })
      if (!error) {
        setShowForm(false)
        setForm({ title: '', content: '' })
        fetchNotes()
      }
    }
    setSaving(false)
  }

  // Delete note
  const handleDelete = async (id: string) => {
    if (!authUser) return
    await supabase.from('notes').delete().eq('id', id).eq('userid', authUser.id)
    fetchNotes()
  }

  // UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-dark-900 to-dark-800 flex flex-col items-center p-2 sm:p-6">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 mt-4">
          <div className="flex items-center gap-3">
            <StickyNote className="w-8 h-8 text-primary-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">My Notes</h1>
          </div>
          <Button
            icon={Plus}
            className="rounded-full bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg hover:scale-110 transition-transform"
            size="lg"
            onClick={() => { setShowForm(true); setEditingNote(null); setForm({ title: '', content: '' }) }}
          >
            Add Note
          </Button>
        </div>
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-dark-300 text-center py-16 text-lg">No notes yet. Click <b>Add Note</b> to get started!</div>
        ) : (
          <div className="flex flex-col gap-6">
            {notes.map(note => (
              <Card key={note.id} className="relative group p-0 overflow-hidden shadow-xl bg-gradient-to-br from-dark-700/80 to-dark-900/90 border-0 transition-transform hover:scale-[1.02]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-6 pt-6 pb-2">
                  <div className="flex items-center gap-3">
                    <StickyNote className="w-6 h-6 text-accent-400 flex-shrink-0" />
                    <h2 className="text-lg sm:text-xl font-semibold text-white truncate max-w-xs sm:max-w-md">{note.title}</h2>
                  </div>
                  <div className="flex gap-2 mt-2 sm:mt-0">
                    <Button size="sm" variant="outline" icon={Edit2} onClick={() => { setShowForm(true); setEditingNote(note); setForm({ title: note.title, content: note.content }) }}>Edit</Button>
                    <Button size="sm" variant="outline" icon={Trash2} onClick={() => handleDelete(note.id)}>Delete</Button>
                  </div>
                </div>
                <div className="px-6 pb-4 text-dark-200 text-base whitespace-pre-line transition-all duration-300">
                  {note.content}
                </div>
                <div className="px-6 pb-3 flex items-center justify-between text-xs text-dark-400">
                  <span>Created: {new Date(note.createdat).toLocaleString()}</span>
                  <span>Last updated: {new Date(note.updatedat).toLocaleString()}</span>
                </div>
                <div className="absolute inset-0 pointer-events-none group-hover:bg-primary-500/5 transition-all duration-300" />
              </Card>
            ))}
          </div>
        )}
      </div>
      {/* Note Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-dark-900 rounded-2xl shadow-2xl w-full max-w-lg mx-2 p-6 relative animate-slide-up">
            <button className="absolute top-3 right-3 text-dark-400 hover:text-red-400" onClick={() => { setShowForm(false); setEditingNote(null); }}>
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              {editingNote ? <Edit2 className="w-5 h-5 text-primary-400" /> : <Plus className="w-5 h-5 text-primary-400" />}
              {editingNote ? 'Edit Note' : 'Add Note'}
            </h2>
            <div className="space-y-4">
              <input
                className="w-full rounded-lg bg-dark-800 text-white p-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Title"
                value={form.title}
                maxLength={80}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
              <textarea
                className="w-full rounded-lg bg-dark-800 text-white p-3 text-base min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Write your note here..."
                value={form.content}
                maxLength={2000}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingNote(null); }}>Cancel</Button>
              <Button icon={Save} onClick={handleSave} disabled={saving || !form.title.trim()}>
                {editingNote ? 'Save Changes' : 'Add Note'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}