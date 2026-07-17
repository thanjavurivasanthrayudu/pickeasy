import React, { useState, useEffect, useCallback } from 'react';
import {
  FileCheck, Bell, Search, RefreshCw, X, Play,
  CheckCircle, XCircle, AlertTriangle, Bot, Shield, ShieldAlert,
  Clock, Hash, Target, ClipboardList, PenTool, User, Car
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMechanicRecord, useMechanicJobs } from '../../hooks/useSupabase';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';

export default function Inspection() {
  const { user } = useAuth();
  const { data: mechanic } = useMechanicRecord(user?.id);
  const { data: jobs, loading: jobsLoading, refetch: refetchJobs } = useMechanicJobs(mechanic?.id);

  // Fetch inspections directly using mechanic.id  (re-runs whenever mechanic loads)
  const [inspections, setInspections] = useState([]);
  const [inspLoading, setInspLoading] = useState(true);

  const fetchInspections = useCallback(async () => {
    if (!mechanic?.id) return;
    setInspLoading(true);
    const { data, error } = await supabase
      .from('inspections')
      .select(`
        *,
        bookings(
          booking_number,
          special_notes,
          scheduled_date,
          city,
          vehicles(brand, model, registration_no),
          customers(profiles(full_name))
        )
      `)
      .eq('mechanic_id', mechanic.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Inspection fetch error:', error);
      toast.error('Failed to load inspections: ' + error.message);
    } else {
      console.log('Inspections loaded:', data);
      setInspections(data || []);
    }
    setInspLoading(false);
  }, [mechanic?.id]);

  useEffect(() => { fetchInspections(); }, [fetchInspections]);

  // Real-time subscription for inspection updates
  useEffect(() => {
    if (!mechanic?.id) return;
    const channel = supabase.channel(`insp-realtime-${mechanic.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'inspections',
        filter: `mechanic_id=eq.${mechanic.id}`
      }, () => fetchInspections())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [mechanic?.id, fetchInspections]);

  const refetchInspections = fetchInspections;

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [submittingId, setSubmittingId] = useState(null);

  // Recent Notifications
  const [recentNotifications, setRecentNotifications] = useState([]);

  // Modal / Checklist State for pending jobs
  const [checklistJob, setChecklistJob] = useState(null);
  const [checklist, setChecklist] = useState([
    { id: 'brakes', label: 'Brakes & Suspension', status: 'good' },
    { id: 'engine', label: 'Engine & Oil', status: 'good' },
    { id: 'tyres', label: 'Tyres & Wheels', status: 'good' },
    { id: 'electrical', label: 'Electrical & Battery', status: 'good' }
  ]);
  const [mechanicNotes, setMechanicNotes] = useState('');

  // AI Assistant States
  const [aiComplaint, setAiComplaint] = useState('');
  const [aiSymptoms, setAiSymptoms] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const loading = jobsLoading || inspLoading;

  // ── Debug: log mechanic + inspection state whenever they change
  useEffect(() => {
    console.log('[DEBUG] user.id:', user?.id);
    console.log('[DEBUG] mechanic:', mechanic);
    console.log('[DEBUG] inspections count:', inspections?.length, inspections);
  }, [user?.id, mechanic, inspections]);

  useEffect(() => {
    if (user?.id) {
      supabase.from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
        .then(({ data }) => {
          if (data) setRecentNotifications(data);
        });
    }
  }, [user]);

  // Guard: mechanic not found
  if (!mechanic && !loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
        <p style={{ fontSize: 16, fontWeight: 600 }}>No mechanic profile found for your account.</p>
        <p style={{ fontSize: 12, marginTop: 4, color: '#94A3B8' }}>User ID: {user?.id}</p>
      </div>
    );
  }

  // Derived Data (Summary Cards)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const safeInspections = inspections || [];
  const thisMonthInspections = safeInspections.filter(i => new Date(i.created_at) >= thisMonth);
  const todayInspections = safeInspections.filter(i => new Date(i.created_at) >= today);

  const stats = {
    good: thisMonthInspections.filter(i => i.inspection_result === 'Good').length,
    bad: thisMonthInspections.filter(i => i.inspection_result === 'Bad').length,
    unable: thisMonthInspections.filter(i => i.inspection_result === 'Unable to Resolve').length,
    total: thisMonthInspections.length,
    goodToday: todayInspections.filter(i => i.inspection_result === 'Good').length,
    badToday: todayInspections.filter(i => i.inspection_result === 'Bad').length,
    unableToday: todayInspections.filter(i => i.inspection_result === 'Unable to Resolve').length,
  };

  // Build Unified List — show ALL assigned jobs (any non-terminal status) + completed inspections
  const ACTIVE_STATUSES = [
    'mechanic_assigned', 'mechanic_accepted', 'mechanic_arrived',
    'in_progress', 'inspection_done'
  ];
  const activeJobs = (jobs || []).filter(j => ACTIVE_STATUSES.includes(j.status));
  const pendingJobs = activeJobs.filter(j => !safeInspections.some(i => i.booking_id === j.id));

  let unifiedList = [
    ...pendingJobs.map(j => ({ ...j, type: 'pending' })),
    ...safeInspections.map(i => ({ ...i, type: 'inspection' }))
  ];

  // Filtering
  if (searchTerm) {
    unifiedList = unifiedList.filter(item => {
      const txt = JSON.stringify(item).toLowerCase();
      return txt.includes(searchTerm.toLowerCase());
    });
  }
  if (filterStatus !== 'All') {
    if (filterStatus === 'Pending') {
      unifiedList = unifiedList.filter(i => i.type === 'pending' || i.inspection_result === 'Pending');
    } else {
      unifiedList = unifiedList.filter(i => i.inspection_result === filterStatus);
    }
  }

  // Actions
  const handleStartChecklist = (job) => {
    setChecklistJob(job);
    setChecklist([
      { id: 'brakes', label: 'Brakes & Suspension', status: 'good' },
      { id: 'engine', label: 'Engine & Oil', status: 'good' },
      { id: 'tyres', label: 'Tyres & Wheels', status: 'good' },
      { id: 'electrical', label: 'Electrical & Battery', status: 'good' }
    ]);
    setMechanicNotes(job.notes || '');
  };

  const handleChecklistStatusChange = (id, newStatus) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
  };

  const submitInitialChecklist = async () => {
    if (!checklistJob || !mechanic) return;
    setSubmittingId('checklist');
    try {
      const { data: insp, error: inspError } = await supabase.from('inspections').insert({
        booking_id: checklistJob.id,
        mechanic_id: mechanic.id,
        overall_rating: checklist.every(c => c.status === 'good') ? 5 : 4,
        notes: mechanicNotes,
        inspection_result: 'Pending',
        completed_at: new Date().toISOString()
      }).select().single();

      if (inspError) throw inspError;

      const items = checklist.map(c => ({
        inspection_id: insp.id,
        component: c.label,
        condition: c.status
      }));

      const { error: itemsError } = await supabase.from('inspection_items').insert(items);
      if (itemsError) throw itemsError;

      await supabase.from('bookings').update({ status: 'inspection_done' }).eq('id', checklistJob.id);

      toast.success('Checklist Initialized! You can now grade the result.');
      setChecklistJob(null);
      refetchJobs();
      refetchInspections();
    } catch (err) {
      toast.error(err.message || 'Failed to initialize checklist');
    }
    setSubmittingId(null);
  };

  const handleInspectionResult = async (inspRecord, resultStatus) => {
    setSubmittingId(inspRecord.id);
    try {
      const { error } = await supabase.from('inspections').update({
        inspection_result: resultStatus,
        updated_by: mechanic.id,
      }).eq('id', inspRecord.id);

      if (error) throw error;
      toast.success(`Marked as ${resultStatus}! Database updated.`);

      // We also trigger refetch so DB trigger's cascade logic pushes everywhere
      refetchInspections();
    } catch (err) {
      toast.error(err.message || 'Failed to update result');
    }
    setSubmittingId(null);
  };

  const handleGenerateAI = async () => {
    if (!aiComplaint.trim() && !aiSymptoms.trim()) return toast.error('Please provide complaint or symptoms.');
    setAiLoading(true);
    setAiResult(null);

    const NVIDIA_API_KEY = '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';

    const systemPrompt = `You are an expert motorcycle and bike service technician AI. Analyze vehicle complaints and symptoms and respond with ONLY a valid JSON object — no markdown, no explanation, no extra text.`;

    const userPrompt = `A mechanic submitted this vehicle report:
- Customer Complaint: "${aiComplaint || 'Not specified'}"
- Observed Symptoms: "${aiSymptoms || 'Not specified'}"

Respond ONLY with this JSON (replace "Low" with "Medium" or "High" as appropriate):
{
  "issues": ["Primary issue", "Secondary issue if applicable"],
  "service": "Recommended service title",
  "steps": ["Step 1", "Step 2", "Step 3"],
  "severity": "Low",
  "eta": "30-60 mins",
  "parts": ["Part name with quantity"],
  "warnings": ["Safety warning if applicable"]
}`;

    try {
      const response = await fetch('/nvidia-api/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${NVIDIA_API_KEY}`
        },
        body: JSON.stringify({
          model: 'meta/llama-3.1-70b-instruct',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.4,
          max_tokens: 1024,
          stream: false
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = data?.message || data?.detail || data?.error || `HTTP ${response.status}`;
        console.error('NVIDIA API Error:', data);
        throw new Error(`NVIDIA Error: ${errMsg}`);
      }

      const rawText = data?.choices?.[0]?.message?.content || '';
      console.log('NVIDIA response:', rawText);

      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not parse AI response. Please try again.');

      const parsed = JSON.parse(jsonMatch[0]);
      if (!['Low', 'Medium', 'High'].includes(parsed.severity)) parsed.severity = 'Medium';
      parsed.timestamp = new Date().toISOString();

      setAiResult(parsed);
      toast.success('AI Diagnostic Complete! 🤖');
    } catch (err) {
      console.error('AI Diagnostic Error:', err);
      toast.error(err.message || 'AI request failed. Check console for details.');
    }

    setAiLoading(false);
  };

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

      {/* 1. PAGE HEADER */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: 8, background: '#EFF6FF', borderRadius: 8 }}><FileCheck size={24} color="#3B82F6" /></div>
            Bike Inspections
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: 500 }}>Manage active inspection routines and AI-assisted diagnostics.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <Bell size={22} color="#64748B" />
            <span style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, background: '#EF4444', borderRadius: '50%', border: '2px solid white' }}></span>
          </div>
          <div style={{ height: 32, width: 1, backgroundColor: '#E2E8F0' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{mechanic?.profiles?.full_name || 'Mechanic'}</div>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Senior Technician</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#3B82F6', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16 }}>
              {mechanic?.profiles?.full_name?.charAt(0) || 'M'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '32px 32px' }}>

        {/* 2. SUMMARY CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 32 }}>

          <div style={{ background: '#FFF', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -15, top: -15, opacity: 0.05 }}><CheckCircle size={100} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ padding: 10, borderRadius: 12, background: '#ECFDF5', color: '#10B981' }}><CheckCircle size={24} /></div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', background: '#F1F5F9', padding: '4px 10px', borderRadius: 20 }}>This Month</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#0F172A' }}>{stats.good}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#64748B', marginTop: 4 }}>Good Inspections</div>
          </div>

          <div style={{ background: '#FFF', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -15, top: -15, opacity: 0.05 }}><XCircle size={100} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ padding: 10, borderRadius: 12, background: '#FEF2F2', color: '#EF4444' }}><XCircle size={24} /></div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', background: '#F1F5F9', padding: '4px 10px', borderRadius: 20 }}>This Month</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#0F172A' }}>{stats.bad}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#64748B', marginTop: 4 }}>Bad Inspections</div>
          </div>

          <div style={{ background: '#FFF', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -15, top: -15, opacity: 0.05 }}><AlertTriangle size={100} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ padding: 10, borderRadius: 12, background: '#FFFBEB', color: '#F59E0B' }}><AlertTriangle size={24} /></div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', background: '#F1F5F9', padding: '4px 10px', borderRadius: 20 }}>This Month</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#0F172A' }}>{stats.unable}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#64748B', marginTop: 4 }}>Unable to Resolve</div>
          </div>

          <div style={{ background: '#FFF', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -15, top: -15, opacity: 0.05 }}><ClipboardList size={100} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ padding: 10, borderRadius: 12, background: '#EFF6FF', color: '#3B82F6' }}><ClipboardList size={24} /></div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', background: '#F1F5F9', padding: '4px 10px', borderRadius: 20 }}>This Month</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#0F172A' }}>{stats.total}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#64748B', marginTop: 4 }}>Total Inspections</div>
          </div>
        </div>

        {/* 11. RESPONSIVE LAYOUT CONTAINER */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start' }}>

          {/* Main Left Column (flex: 2) -> Inspections List */}
          <div style={{ flex: '2 1 650px', display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Toolbar */}
            <div style={{ background: '#FFF', padding: '16px 24px', borderRadius: 16, border: '1px solid #E2E8F0', display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 16, flex: 1, minWidth: 300 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Search IDs, Names, Bike numbers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: 12, border: '1px solid #CBD5E1', fontSize: 14, fontWeight: 500, outline: 'none', background: '#F8FAFC' }}
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid #CBD5E1', fontSize: 14, fontWeight: 600, outline: 'none', background: '#FFF', color: '#334155', cursor: 'pointer' }}>
                  <option value="All">All Status</option>
                  <option value="Pending">Pending / New</option>
                  <option value="Good">Good</option>
                  <option value="Bad">Bad</option>
                  <option value="Unable to Resolve">Unable</option>
                </select>
              </div>
              <button
                onClick={() => { refetchJobs(); refetchInspections(); }}
                style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0', background: '#F1F5F9', color: '#475569', display: 'flex', gap: 8, alignItems: 'center', fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}>
                <RefreshCw size={18} className={loading ? 'spin' : ''} /> {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {/* Empty States / Loaders */}
            {loading && unifiedList.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ height: 260, background: '#E2E8F0', borderRadius: 16, animation: 'pulse 1.5s infinite' }} />
                ))}
              </div>
            ) : unifiedList.length === 0 ? (
              <div style={{ background: '#FFF', padding: 60, borderRadius: 16, border: '1px dashed #CBD5E1', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ background: '#F1F5F9', padding: 24, borderRadius: '50%', marginBottom: 16 }}><FileCheck size={48} color="#94A3B8" /></div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#334155', marginBottom: 8 }}>No Inspection Records Found</h3>
                <p style={{ fontSize: 15, color: '#64748B', maxWidth: 400, marginBottom: 8 }}>There are currently no active jobs pending inspection or completed records matching your filters.</p>
                {/* Debug info */}
                <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 24, fontFamily: 'monospace', background: '#F8FAFC', padding: '8px 16px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  Jobs: {(jobs || []).length} total | Active (in scope): {activeJobs.length} | Inspections: {safeInspections.length}
                  {(jobs || []).length > 0 && <><br />Job statuses: {[...new Set((jobs || []).map(j => j.status))].join(', ')}</>}
                </p>
                <button onClick={() => { setSearchTerm(''); setFilterStatus('All'); refetchJobs(); refetchInspections(); }} style={{ padding: '12px 24px', background: '#3B82F6', color: '#FFF', borderRadius: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>Clear Filters / Refresh</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {unifiedList.map(item => {

                  const isPending = item.type === 'pending';
                  // Derived properties whether it's Job or Inspection
                  const bookingData = isPending ? item : item.bookings;
                  const custName = isPending ? item.customers?.profiles?.full_name : item.bookings?.customers?.profiles?.full_name;
                  const currResult = isPending ? 'Pending' : (item.inspection_result || 'Pending');

                  return (
                    <div key={item.id} style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                      {/* Header Bar */}
                      <div style={{ padding: '16px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ padding: '6px 12px', background: '#E0E7FF', color: '#4338CA', borderRadius: 8, fontSize: 13, fontWeight: 800, border: '1px solid #C7D2FE' }}>
                            {isPending ? 'NEW JOB' : `INS-${item.id.substring(0, 6).toUpperCase()}`}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Book ID: #{isPending ? item.booking_number : item.bookings?.booking_number}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Clock size={14} /> {new Date(item.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>

                      <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) minmax(200px, 1fr)', gap: 24 }}>

                        {/* Details Left */}
                        <div style={{ display: 'flex', gap: 20 }}>
                          <div style={{ width: 80, height: 80, background: '#F1F5F9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', flexShrink: 0 }}>
                            <Car size={40} color="#94A3B8" />
                          </div>
                          <div>
                            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>{bookingData?.vehicles?.brand} {bookingData?.vehicles?.model}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F1F5F9', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#334155', border: '1px solid #CBD5E1' }}>
                                <Hash size={12} /> {bookingData?.vehicles?.registration_no}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}><Target size={14} /> ODO: 12,450 km</span>
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <User size={16} /> Customer: <span style={{ color: '#0F172A' }}>{custName || 'Walk-in Customer'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Details right (Complaint) */}
                        <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Customer Complaint / Notes</div>
                          <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.5, fontWeight: 500, margin: 0 }}>
                            "{isPending ? 'General service request.' : (item.notes || 'No additional notes recorded.')}"
                          </p>
                        </div>

                      </div>

                      {/* Action Footer */}
                      <div style={{ padding: '20px 24px', borderTop: '1px solid #F1F5F9', background: '#FFF' }}>
                        {isPending ? (
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleStartChecklist(item)}
                              style={{ padding: '12px 24px', borderRadius: 12, background: '#2563EB', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
                              <PenTool size={18} /> Begin Setup & Checklist
                            </button>
                          </div>
                        ) : (
                          // Graded Action Area
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: '#64748B' }}>Status:</span>
                              <span style={{
                                padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6,
                                background: currResult === 'Good' ? '#ECFDF5' : currResult === 'Bad' ? '#FEF2F2' : currResult === 'Unable to Resolve' ? '#FFFBEB' : '#F1F5F9',
                                color: currResult === 'Good' ? '#10B981' : currResult === 'Bad' ? '#EF4444' : currResult === 'Unable to Resolve' ? '#F59E0B' : '#64748B',
                                border: `1px solid ${currResult === 'Good' ? '#A7F3D0' : currResult === 'Bad' ? '#FECACA' : currResult === 'Unable to Resolve' ? '#FDE68A' : '#E2E8F0'}`
                              }}>
                                {currResult === 'Good' ? <CheckCircle size={16} /> : currResult === 'Bad' ? <XCircle size={16} /> : currResult === 'Unable to Resolve' ? <AlertTriangle size={16} /> : <Clock size={16} />}
                                {currResult}
                              </span>
                            </div>

                            {['Good', 'Bad', 'Unable to Resolve'].includes(currResult) ? null : (
                              <div style={{ display: 'flex', gap: 12 }}>
                                <button
                                  disabled={submittingId === item.id}
                                  onClick={() => handleInspectionResult(item, 'Good')}
                                  style={{ padding: '10px 20px', borderRadius: 8, background: '#10B981', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: submittingId === item.id ? 0.6 : 1, transition: '0.2s', boxShadow: '0 2px 8px rgba(16,185,129,0.2)' }}>
                                  <CheckCircle size={18} /> Good
                                </button>
                                <button
                                  disabled={submittingId === item.id}
                                  onClick={() => handleInspectionResult(item, 'Bad')}
                                  style={{ padding: '10px 20px', borderRadius: 8, background: '#EF4444', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: submittingId === item.id ? 0.6 : 1, transition: '0.2s', boxShadow: '0 2px 8px rgba(239,68,68,0.2)' }}>
                                  <XCircle size={18} /> Bad
                                </button>
                                <button
                                  disabled={submittingId === item.id}
                                  onClick={() => handleInspectionResult(item, 'Unable to Resolve')}
                                  style={{ padding: '10px 20px', borderRadius: 8, background: '#F59E0B', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: submittingId === item.id ? 0.6 : 1, transition: '0.2s', boxShadow: '0 2px 8px rgba(245,158,11,0.2)' }}>
                                  <AlertTriangle size={18} /> Unable to Resolve
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* 8. RECENT NOTIFICATIONS */}
            <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: 24, marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Bell size={20} color="#3B82F6" /> Recent Notifications
                </h3>
                <button style={{ background: 'none', border: 'none', color: '#3B82F6', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>View All Actions</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recentNotifications.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8', fontWeight: 500 }}>No recent telemetry found.</div>
                ) : recentNotifications.map(n => (
                  <div key={n.id} style={{ display: 'flex', gap: 16, padding: '16px', background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', alignItems: 'flex-start' }}>
                    <div style={{ padding: 8, background: '#FFF', borderRadius: 8, border: '1px solid #E2E8F0', flexShrink: 0 }}><ShieldAlert size={18} color="#64748B" /></div>
                    <div>
                      <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}><Clock size={12} /> {new Date(n.created_at).toLocaleString()} &nbsp;•&nbsp; System</div>
                      <p style={{ margin: 0, fontSize: 14, color: '#334155', fontWeight: 500 }}>{n.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column (AI Assistant & Summaries) */}
          <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* 6. AI INSPECTION ASSISTANT */}
            <div style={{ background: '#FFF', borderRadius: 16, padding: 24, border: '1.5px solid #E0E7FF', boxShadow: '0 10px 25px -5px rgba(59,130,246,0.1)' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ padding: 10, background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)', borderRadius: 12, color: '#FFF' }}>
                  <Bot size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>AI Inspection Assistant</h3>
                  <div style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>Diagnostic Copilot & Analysis</div>
                </div>
              </div>

              <div style={{ height: 1, background: 'linear-gradient(90deg, #E2E8F0 0%, transparent 100%)', margin: '20px 0' }} />

              <p style={{ fontSize: 14, color: '#475569', marginBottom: 20, fontWeight: 500 }}>Describe customer complaint and observed symptoms to generate deep diagnostic recommendations.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8, display: 'block' }}>Customer Complaint</label>
                  <input
                    value={aiComplaint}
                    onChange={e => setAiComplaint(e.target.value)}
                    placeholder="E.g., Vehicle struggling to climb slopes..."
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #CBD5E1', fontSize: 14, outline: 'none', background: '#F8FAFC' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8, display: 'block' }}>Symptoms / Observations</label>
                  <textarea
                    value={aiSymptoms}
                    onChange={e => setAiSymptoms(e.target.value)}
                    placeholder="E.g., High revs but low power output, slight burning smell from casing..."
                    style={{ width: '100%', minHeight: 100, padding: '12px 16px', borderRadius: 12, border: '1px solid #CBD5E1', fontSize: 14, outline: 'none', background: '#F8FAFC', resize: 'vertical' }}
                  />
                </div>
                <button
                  disabled={aiLoading}
                  onClick={handleGenerateAI}
                  style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#0F172A', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, transition: '0.2s', marginTop: 8 }}>
                  {aiLoading ? <RefreshCw className="spin" size={20} /> : <Play size={20} />}
                  {aiLoading ? 'Running AI Engine...' : 'Generate Suggestions'}
                </button>
              </div>

            </div>

            {/* 7. AI RESPONSE CARD */}
            {aiResult && (
              <div style={{ background: '#FFF', borderRadius: 16, padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative' }}>

                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield color="#10B981" size={20} /> Diagnostic Report
                </h3>

                <div style={{ display: 'grid', gap: 16 }}>

                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>Possible Issues</div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: '#334155', fontWeight: 500, lineHeight: 1.6 }}>
                      {aiResult.issues.map((i, idx) => <li key={idx}>{i}</li>)}
                    </ul>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>Recommended Service</div>
                    <div style={{ fontSize: 14, color: '#0F172A', fontWeight: 700, background: '#F1F5F9', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      {aiResult.service}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 24, padding: '16px 0', borderTop: '1px dashed #CBD5E1', borderBottom: '1px dashed #CBD5E1' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>Est. Severity</div>
                      <span style={{
                        padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: 800,
                        background: aiResult.severity === 'Low' ? '#ECFDF5' : aiResult.severity === 'Medium' ? '#FFFBEB' : '#FEF2F2',
                        color: aiResult.severity === 'Low' ? '#10B981' : aiResult.severity === 'Medium' ? '#F59E0B' : '#EF4444'
                      }}>
                        {aiResult.severity}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>Repair Time</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={16} /> {aiResult.eta}</div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>Suggested Spare Parts</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {aiResult.parts.map((p, idx) => (
                        <span key={idx} style={{ padding: '6px 12px', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#475569' }}>{p}</span>
                      ))}
                    </div>
                  </div>

                  {encodeURI(aiResult.warnings) && (
                    <div style={{ padding: 16, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, color: '#EF4444', display: 'flex', gap: 12, alignItems: 'flex-start', marginTop: 8 }}>
                      <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Safety Warning</div>
                        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5, opacity: 0.9 }}>{aiResult.warnings[0]}</div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* 9. INSPECTION SUMMARY */}
            <div style={{ background: '#FFF', borderRadius: 16, padding: 24, border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 20 }}>Today's Live Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#10B981', fontWeight: 600, fontSize: 15 }}><CheckCircle size={18} /> Good</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{stats.goodToday}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#EF4444', fontWeight: 600, fontSize: 15 }}><XCircle size={18} /> Bad</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{stats.badToday}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#F59E0B', fontWeight: 600, fontSize: 15 }}><AlertTriangle size={18} /> Unable to Resolve</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{stats.unableToday}</div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Basic Modal Implementation Inline for the Checklist setup */}
      {checklistJob && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#FFF', width: '100%', maxWidth: 500, borderRadius: 24, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>Start Technical Routine</h2>
                <div style={{ fontSize: 13, color: '#64748B', fontWeight: 500, marginTop: 4 }}>For Bike #{checklistJob.vehicles?.registration_no}</div>
              </div>
              <button onClick={() => setChecklistJob(null)} style={{ background: '#E2E8F0', border: 'none', padding: 8, borderRadius: '50%', cursor: 'pointer', color: '#475569' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20, maxHeight: '60vh', overflowY: 'auto' }}>
              {checklist.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F1F5F9', padding: '16px 20px', borderRadius: 12 }}>
                  <span style={{ fontWeight: 700, color: '#1E293B', fontSize: 14 }}>{item.label}</span>
                  <select
                    value={item.status}
                    onChange={e => handleChecklistStatusChange(item.id, e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFF', fontWeight: 600, fontSize: 13, outline: 'none' }}>
                    <option value="good">Good Condition</option>
                    <option value="fair">Fair / Functional</option>
                    <option value="needs_attention">Needs Attention</option>
                  </select>
                </div>
              ))}

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8, display: 'block' }}>Initial Mechanic Notes</label>
                <textarea
                  value={mechanicNotes}
                  onChange={e => setMechanicNotes(e.target.value)}
                  placeholder="Document current pre-inspection state..."
                  style={{ width: '100%', minHeight: 100, padding: '16px', borderRadius: 12, border: '1px solid #CBD5E1', fontSize: 14, outline: 'none', background: '#FFF', resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ padding: '24px 32px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setChecklistJob(null)} style={{ padding: '12px 24px', borderRadius: 12, background: 'transparent', color: '#64748B', fontWeight: 700, border: '1px solid #CBD5E1', cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={submitInitialChecklist}
                disabled={submittingId === 'checklist'}
                style={{ padding: '12px 24px', borderRadius: 12, background: '#3B82F6', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.2)' }}>
                {submittingId === 'checklist' ? 'Saving...' : 'Start Grading Routine'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Embedded Styles for Animations/Resets missing in baseline */}
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
      `}</style>
    </div>
  );
}
