'use client';

import { useState } from 'react';
import { Subject } from '@/lib/api';
import { createClient } from '@/lib/supabase/browser';
import styles from './admin.module.css';
import { useRouter } from 'next/navigation';

export default function AdminForm({ subjects }: { subjects: Subject[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [title, setTitle] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [negeri, setNegeri] = useState('MRSM');
  const [paperType, setPaperType] = useState('Kertas 1');
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const [externalUrl, setExternalUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !title || !year) {
      setMessage({ type: 'error', text: 'Please fill in all subject and paper details.' });
      return;
    }

    if (uploadMode === 'file' && !file) {
      setMessage({ type: 'error', text: 'Please select a PDF file to upload.' });
      return;
    }

    if (uploadMode === 'url' && (!externalUrl || !externalUrl.trim().startsWith('http'))) {
      setMessage({ type: 'error', text: 'Please enter a valid link (starting with http:// or https://).' });
      return;
    }

    setIsUploading(true);
    setMessage({ type: '', text: '' });

    try {
      let finalFilePath = externalUrl.trim();

      // 1. Upload file to Supabase Storage if file mode
      if (uploadMode === 'file' && file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${subjectId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('exam-papers')
          .upload(fileName, file);

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
        finalFilePath = uploadData.path;
      }

      // 2. Insert record into database
      const { error: dbError } = await supabase.from('papers').insert({
        subject_id: subjectId,
        title,
        year: parseInt(year, 10),
        file_path: finalFilePath,
        negeri,
        paper_type: paperType
      });

      if (dbError) throw new Error(`Database error: ${dbError.message}`);

      // Success!
      setMessage({ type: 'success', text: uploadMode === 'url' ? 'Paper link added successfully!' : 'Paper uploaded successfully!' });
      router.refresh();
      
      // Reset form
      setTitle('');
      setExternalUrl('');
      setFile(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form className={`card ${styles.adminForm}`} onSubmit={handleSubmit}>
      {message.text && (
        <div className={`${styles.message} ${message.type === 'error' ? styles.messageError : styles.messageSuccess}`}>
          {message.text}
        </div>
      )}

      <div className={styles.formGroup}>
        <label>Add Method</label>
        <div className={styles.modeToggle}>
          <button
            type="button"
            className={`${styles.modeBtn} ${uploadMode === 'url' ? styles.modeBtnActive : ''}`}
            onClick={() => setUploadMode('url')}
          >
            🔗 External URL / Google Drive
          </button>
          <button
            type="button"
            className={`${styles.modeBtn} ${uploadMode === 'file' ? styles.modeBtnActive : ''}`}
            onClick={() => setUploadMode('file')}
          >
            📁 Upload PDF File
          </button>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="subject">Subject</label>
        <select 
          id="subject" 
          value={subjectId} 
          onChange={(e) => setSubjectId(e.target.value)}
          className={styles.input}
          required
        >
          {subjects.map(sub => (
            <option key={sub.id} value={sub.id}>
              {sub.name} ({sub.code})
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="title">Paper Title (e.g., Midterm Exam, Final Exam)</label>
        <input 
          id="title"
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          className={styles.input}
          required 
          placeholder="Midterm Exam"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="year">Year</label>
        <input 
          id="year"
          type="number" 
          value={year} 
          onChange={(e) => setYear(e.target.value)}
          className={styles.input}
          required 
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="negeri">Negeri / Source</label>
        <select 
          id="negeri" 
          value={negeri} 
          onChange={(e) => setNegeri(e.target.value)}
          className={styles.input}
        >
          <option value="MRSM">MRSM</option>
          <option value="SBP">SBP</option>
          <option value="Johor">Johor</option>
          <option value="Kedah">Kedah</option>
          <option value="Kelantan">Kelantan</option>
          <option value="Melaka">Melaka</option>
          <option value="Negeri Sembilan">Negeri Sembilan</option>
          <option value="Pahang">Pahang</option>
          <option value="Perak">Perak</option>
          <option value="Perlis">Perlis</option>
          <option value="Pulau Pinang">Pulau Pinang</option>
          <option value="Sabah">Sabah</option>
          <option value="Sarawak">Sarawak</option>
          <option value="Selangor">Selangor</option>
          <option value="Terengganu">Terengganu</option>
          <option value="W.P. Kuala Lumpur">W.P. Kuala Lumpur</option>
          <option value="W.P. Labuan">W.P. Labuan</option>
          <option value="W.P. Putrajaya">W.P. Putrajaya</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="paperType">Jenis Kertas</label>
        <select 
          id="paperType" 
          value={paperType} 
          onChange={(e) => setPaperType(e.target.value)}
          className={styles.input}
        >
          <option value="Kertas 1">Kertas 1</option>
          <option value="Kertas 2">Kertas 2</option>
          <option value="Kertas 3">Kertas 3</option>
          <option value="Skema Kertas 1">Skema Kertas 1</option>
          <option value="Skema Kertas 2">Skema Kertas 2</option>
          <option value="Skema Kertas 3">Skema Kertas 3</option>
          <option value="Amali">Amali</option>
        </select>
      </div>

      {uploadMode === 'url' ? (
        <div className={styles.formGroup}>
          <label htmlFor="externalUrl">Paper Link (Google Drive, Online PDF URL)</label>
          <input 
            id="externalUrl"
            type="url"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            className={styles.input}
            placeholder="https://drive.google.com/file/d/... or https://.../paper.pdf"
            required={uploadMode === 'url'}
          />
        </div>
      ) : (
        <div className={styles.formGroup}>
          <label htmlFor="file-upload">PDF File</label>
          <input 
            id="file-upload"
            type="file" 
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className={styles.fileInput}
            required={uploadMode === 'file'}
          />
        </div>
      )}

      <button 
        type="submit" 
        className={styles.submitBtn} 
        disabled={isUploading}
      >
        {isUploading ? 'Saving...' : (uploadMode === 'url' ? 'Add Paper Link' : 'Upload Paper')}
      </button>
    </form>
  );
}
