import { createClient } from '@supabase/supabase-js';
import { UploadedFile, Analysis, ChatSession } from '../types/index.js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase credentials not configured. Using in-memory storage.');
}

let supabase: any;
try {
  supabase = createClient(supabaseUrl || 'http://localhost:54321', supabaseKey || 'test-key');
} catch (err) {
  console.warn('⚠️  Supabase client creation failed, using in-memory storage only:', err);
  supabase = null;
}

export { supabase };

// In-memory fallback storage
const fileStorage = new Map<string, UploadedFile>();
const analysisStorage = new Map<string, Analysis>();
const sessionStorage = new Map<string, ChatSession>();

// File Management
export async function saveUploadedFile(file: UploadedFile): Promise<void> {
  if (supabase && supabaseUrl && supabaseKey) {
    try {
      const { error } = await supabase
        .from('uploaded_files')
        .insert([file]);
      if (error) throw error;
    } catch (err) {
      console.warn('Supabase save failed, falling back to in-memory:', err);
      fileStorage.set(file.id, file);
    }
  } else {
    fileStorage.set(file.id, file);
  }
}

export async function getUploadedFile(fileId: string): Promise<UploadedFile | null> {
  if (supabase && supabaseUrl && supabaseKey) {
    try {
      const { data, error } = await supabase
        .from('uploaded_files')
        .select('*')
        .eq('id', fileId)
        .single();
      if (error) return fileStorage.get(fileId) || null;
      return data;
    } catch (err) {
      return fileStorage.get(fileId) || null;
    }
  } else {
    return fileStorage.get(fileId) || null;
  }
}

export async function updateFileStatus(
  fileId: string,
  status: 'processing' | 'completed' | 'failed',
  errorMessage?: string
): Promise<void> {
  if (supabaseUrl && supabaseKey) {
    const { error } = await supabase
      .from('uploaded_files')
      .update({ status, error_message: errorMessage })
      .eq('id', fileId);
    if (error) throw error;
  } else {
    const file = fileStorage.get(fileId);
    if (file) {
      file.status = status;
      if (errorMessage) file.error_message = errorMessage;
    }
  }
}

// Analysis Management
export async function saveAnalysis(analysis: Analysis): Promise<void> {
  if (supabase && supabaseUrl && supabaseKey) {
    try {
      const { error } = await supabase
        .from('analyses')
        .insert([{
          id: analysis.id,
          file_id: analysis.file_id,
          analysis_data: analysis.analysis_data,
          created_at: analysis.created_at,
          updated_at: analysis.updated_at
        }]);
      if (error) throw error;
    } catch (err) {
      console.warn('Supabase analysis save failed, falling back to in-memory:', err);
      analysisStorage.set(analysis.id, analysis);
    }
  } else {
    analysisStorage.set(analysis.id, analysis);
  }
}

export async function getAnalysis(fileId: string): Promise<Analysis | null> {
  if (supabase && supabaseUrl && supabaseKey) {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('file_id', fileId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (error) {
        for (const analysis of analysisStorage.values()) {
          if (analysis.file_id === fileId) return analysis;
        }
        return null;
      }
      return data;
    } catch (err) {
      for (const analysis of analysisStorage.values()) {
        if (analysis.file_id === fileId) return analysis;
      }
      return null;
    }
  } else {
    for (const analysis of analysisStorage.values()) {
      if (analysis.file_id === fileId) return analysis;
    }
    return null;
  }
}

// Chat Session Management
export async function saveSession(session: ChatSession): Promise<void> {
  if (supabaseUrl && supabaseKey) {
    const { error } = await supabase
      .from('chat_sessions')
      .insert([{
        id: session.id,
        file_id: session.file_id,
        messages: session.messages,
        created_at: session.created_at,
        updated_at: session.updated_at
      }]);
    if (error) throw error;
  } else {
    sessionStorage.set(session.id, session);
  }
}

export async function getSession(fileId: string): Promise<ChatSession | null> {
  if (supabaseUrl && supabaseKey) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('file_id', fileId)
      .limit(1)
      .single();
    if (error) return null;
    return data;
  } else {
    for (const session of sessionStorage.values()) {
      if (session.file_id === fileId) return session;
    }
    return null;
  }
}

export async function updateSession(session: ChatSession): Promise<void> {
  if (supabaseUrl && supabaseKey) {
    const { error } = await supabase
      .from('chat_sessions')
      .update({
        messages: session.messages,
        updated_at: new Date()
      })
      .eq('id', session.id);
    if (error) throw error;
  } else {
    session.updated_at = new Date();
    sessionStorage.set(session.id, session);
  }
}
