import React, { useMemo } from 'react'

interface StartupScreenProps {
  visible: boolean
}

export const StartupScreen: React.FC<StartupScreenProps> = ({ visible }) => {
  const screenClass = useMemo(
    () =>
      `startup-overlay ${visible ? 'startup-overlay--visible' : 'startup-overlay--hidden'}`,
    [visible]
  )

  return (
    <div className={screenClass} aria-hidden={!visible}>
      <div className="startup-overlay__glow" />
      <div className="startup-overlay__content">
        <div className="startup-logo">
          <span className="startup-logo-char startup-logo-char-1">少</span>
          <span className="startup-logo-char startup-logo-char-2">纳</span>
          <span className="startup-logo-char startup-logo-char-3">言</span>
        </div>
        <div className="startup-title">少纳言中医知识图谱</div>
        <div className="startup-subtitle">Shonaoyan Traditional Chinese Medicine Graph</div>
        <div className="startup-progress">
          <span />
        </div>
      </div>
    </div>
  )
}

