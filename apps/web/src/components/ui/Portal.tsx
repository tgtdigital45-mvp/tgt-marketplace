import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
}

const Portal: React.FC<PortalProps> = ({ children }) => {
  const el = useRef(document.createElement('div'));

  useEffect(() => {
    const portalRoot = document.body;
    portalRoot.appendChild(el.current);
    return () => {
      portalRoot.removeChild(el.current);
    };
  }, []);

  return createPortal(children, el.current);
};

export default Portal;
