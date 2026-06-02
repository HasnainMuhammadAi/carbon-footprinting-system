import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

const API_URL = import.meta.env.VITE_API_URL;

export default function FaceEnroll() {
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus]   = useState('idle');
  const [message, setMessage] = useState('');
  const [modelsReady, setModelsReady] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      setStatus('loading');
      setMessage('Loading models...');
      try {
        const MODEL_URL = '/models';
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        setModelsReady(true);
        setStatus('idle');
        setMessage('');
      } catch (err) {
        console.error('MODEL LOAD ERROR:', err);
        setStatus('error');
        setMessage(`Failed to load models: ${err.message}`);
      }
    };
    loadModels();
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStatus('scanning');
      setMessage('Look straight at the camera, then click Enroll.');
    } catch {
      setStatus('error');
      setMessage('Camera access denied.');
    }
  };

  const enrollFace = async () => {
    if (!videoRef.current) return;
    setMessage('Detecting face... (2-5 sec)');

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setMessage('No face detected. Move closer or improve lighting, then try again.');
        return;
      }

      setMessage('Face detected! Saving...');
      const descriptor = Array.from(detection.descriptor);
      const token = localStorage.getItem('token');

      const res = await fetch(`${API_URL}/auth/face-enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ descriptor }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage('✓ Face enrolled! You can now use face login.');
        stopCamera();
      } else {
        setStatus('error');
        setMessage(data.message || 'Enrollment failed.');
      }
    } catch (err) {
      console.error('ENROLL ERROR:', err);
      setStatus('error');
      setMessage('Detection error. Try again.');
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <div style={{
        width: 280, height: 210, margin: '0 auto 12px',
        borderRadius: 12, overflow: 'hidden', background: '#111',
        border: status === 'scanning' ? '2px solid #22c55e' : '2px solid #374151',
      }}>
        <video
          ref={videoRef} autoPlay muted playsInline
          width={280} height={210}
          style={{ objectFit: 'cover', display: status === 'scanning' ? 'block' : 'none' }}
        />
        {status !== 'scanning' && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#9ca3af', fontSize:13 }}>
            {status === 'loading' ? 'Loading models...' : status === 'success' ? '✓ Enrolled' : 'Camera off'}
          </div>
        )}
      </div>

      {message && (
        <p style={{
          fontSize: 13, marginBottom: 12,
          color: status === 'error' ? '#f87171' : status === 'success' ? '#22c55e' : '#9ca3af',
        }}>
          {message}
        </p>
      )}

      {status === 'idle' && modelsReady && (
        <button onClick={startCamera}
          style={{ padding:'10px 20px', background:'#16a34a', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:14 }}>
          📷 Start Camera
        </button>
      )}

      {status === 'loading' && (
        <p style={{ color:'#9ca3af', fontSize:13 }}>Please wait...</p>
      )}

      {status === 'scanning' && (
        <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
          <button onClick={enrollFace}
            style={{ padding:'10px 20px', background:'#16a34a', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:14 }}>
            ✓ Enroll My Face
          </button>
          <button onClick={() => { stopCamera(); setStatus('idle'); setMessage(''); }}
            style={{ padding:'10px 20px', background:'transparent', color:'#9ca3af', border:'1px solid #374151', borderRadius:8, cursor:'pointer', fontSize:14 }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}