import React from 'react'
import { useLocation, useParams } from 'react-router-dom'

interface DebugInfoProps {
  data?: Record<string, any>;
  title?: string;
}

const DebugInfo: React.FC<DebugInfoProps> = ({ data = {}, title = 'Debug Info' }) => {
  const location = useLocation();
  const params = useParams();

  return (
    <div className="p-3 my-2 bg-blue-50 border border-blue-200 rounded-md text-xs overflow-hidden">
      <details>
        <summary className="font-medium cursor-pointer">{title}</summary>
        <div className="mt-2 space-y-2">
          <div>
            <h3 className="font-medium">Route Info:</h3>
            <pre className="mt-1 bg-white p-2 rounded overflow-auto max-h-40">
              {JSON.stringify({ 
                pathname: location.pathname,
                search: location.search,
                hash: location.hash,
                params
              }, null, 2)}
            </pre>
          </div>
          
          {Object.keys(data).length > 0 && (
            <div>
              <h3 className="font-medium">Component Data:</h3>
              <pre className="mt-1 bg-white p-2 rounded overflow-auto max-h-60">
                {JSON.stringify(data, (key, value) => {
                  // Avoid circular references and limit depth
                  if (typeof value === 'object' && value !== null) {
                    // For arrays just show length if it's too large
                    if (Array.isArray(value) && value.length > 10) {
                      return `Array(${value.length})`
                    }
                    // For objects exclude certain props to simplify output
                    const copy = { ...value };
                    ['children', '_source', '__proto__'].forEach(key => {
                      if (key in copy) delete copy[key];
                    });
                    return copy;
                  }
                  return value;
                }, 2)}
              </pre>
            </div>
          )}
        </div>
      </details>
    </div>
  )
}

export default DebugInfo 