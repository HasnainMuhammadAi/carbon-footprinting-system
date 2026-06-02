import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

const API_URL = import.meta.env.VITE_API_URL;

export default function FaceLogin({ onSuccess }) {
  const videoRef    = useRef(null);
  const streamRef   = useRef(null);
  const [status, setStatus]   = useState('idle');
  const [message, setMessage] = useState('');
  const [modelsReady, setModelsReady] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      setStatus('loading');
      setMessage('Loading face recognition models...');
      try {
        const MODEL_URL = '/models';
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        setModelsReady(true);
        setStatus('idle');
        setMessage('');
      } catch {
        setStatus('error');
        setMessage('Failed to load models. Check /public/models folder.');
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
      setMessage('Position your face in the frame...');
    } catch {
      setStatus('error');
      setMessage('Camera access denied.');
    }
  };

  const scanAndLogin = async () => {
    if (!videoRef.current) return;
    setMessage('Scanning face...');

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setMessage('No face detected. Look directly at the camera.');
        return;
      }

      const descriptor = Array.from(detection.descriptor);

      const res = await fetch(`${API_URL}/auth/face-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descriptor }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(`Welcome, ${data.user.fullName}!`);
        stopCamera();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (onSuccess) onSuccess(data);
      } else {
        setStatus('error');
        setMessage(data.message || 'Face not recognised.');
      }
    } catch {
      setStatus('error');
      setMessage('Scan failed. Try again.');
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        position: 'relative', width: 280, height: 210,
        margin: '0 auto 12px', borderRadius: 12, overflow: 'hidden',
        background: '#111',
        border: status === 'scanning' ? '2px solid #22c55e' : '2px solid #374151',
      }}>
        <video ref={videoRef} autoPlay muted playsInline width={280} height={210}
          style={{ objectFit: 'cover', display: status === 'scanning' ? 'block' : 'none' }} />
        {status !== 'scanning' && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#9ca3af', fontSize:13 }}>
            {status === 'loading' ? 'Loading...' : 'Camera off'}
          </div>
        )}
      </div>

      {message && (
        <p style={{
          fontSize: 13, color: status === 'error' ? '#f87171' : status === 'success' ? '#22c55e' : '#9ca3af',
          marginBottom: 12, minHeight: 20,
        }}>
          {message}
        </p>
      )}

      {status === 'idle' && modelsReady && (
        <button onClick={startCamera}
          style={{ padding:'10px 20px', background:'#16a34a', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:14 }}>
          📷 Open Camera
        </button>
      )}

      {status === 'scanning' && (
        <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
          <button onClick={scanAndLogin}
            style={{ padding:'10px 20px', background:'#16a34a', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:14 }}>
            🔍 Scan Face
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
