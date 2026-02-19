import { useState, useRef, useEffect } from "react";
import styles from "./CustomAudioPlayer.module.css";

const CustomAudioPlayer = ({ src }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newProgress = e.target.value;
    const newTime = (newProgress / 100) * duration;
    
    audio.currentTime = newTime;
    setProgress(newProgress);
    setCurrentTime(newTime);
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className={styles.playerContainer}>
      <div className={styles.avatar}>
        <i className="fa-solid fa-headphones"></i>
         {/* Could add a small mic icon overlay if needed */}
      </div>
      
      <div className={styles.controls}>
        <div className={styles.sliderContainer}>
            <button className={styles.playPauseBtn} onClick={togglePlay}>
                <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
            </button>
            <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleSeek}
                className={styles.slider}
                // Dynamic gradient for progress fill
                style={{
                    background: `linear-gradient(to right, #00a884 ${progress}%, #d1d7db ${progress}%)`
                }}
            />
        </div>
        <div className={styles.timeInfo}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
};

export default CustomAudioPlayer;
