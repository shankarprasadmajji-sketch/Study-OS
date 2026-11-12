import React, { useEffect, useRef, useState } from 'react';
import { GitBranch, Layers, AlertCircle, ArrowRight, Lightbulb } from 'lucide-react';
import mermaid from 'mermaid';
import { TopicFlowchart } from '../../types/index.js';

interface FlowchartRendererProps {
  flowchart: TopicFlowchart;
  isDark?: boolean;
}

export const FlowchartRenderer: React.FC<FlowchartRendererProps> = ({ flowchart, isDark = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function renderMermaid() {
      if (!flowchart?.mermaidCode || flowchart.mermaidCode.trim().length === 0) {
        setSvgContent(null);
        return;
      }

      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily: 'Inter, system-ui, sans-serif',
        });

        const id = `mermaid_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const { svg } = await mermaid.render(id, flowchart.mermaidCode);

        if (isMounted) {
          setSvgContent(svg);
          setRenderError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('[FlowchartRenderer] Mermaid render warning:', err);
          setRenderError('Visual diagram generated. See process map breakdown below.');
        }
      }
    }

    renderMermaid();

    return () => {
      isMounted = false;
    };
  }, [flowchart?.mermaidCode, isDark]);

  const steps = flowchart?.steps || [];

  return (
    <div className="space-y-6">
      {/* Visual Diagram Canvas */}
      {svgContent ? (
        <div className="p-4 rounded-xl border border-border bg-card overflow-x-auto flex justify-center shadow-subtle">
          <div
            ref={containerRef}
            className="mermaid-output max-w-full"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        </div>
      ) : renderError ? (
        <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-primary-500 shrink-0" />
          <span>{renderError}</span>
        </div>
      ) : null}

      {/* Step-by-Step Concept & Process Flow */}
      {steps.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Step-by-Step Concept Breakdown ({steps.length} Phases)
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {steps.map((st, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-border bg-card/60 hover:border-primary-400 transition-all space-y-2 relative"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300 font-bold text-xs flex items-center justify-center shrink-0">
                      {st.stepNumber || idx + 1}
                    </span>
                    <span className="text-xs font-bold text-foreground">{st.title}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60 hidden sm:block" />
                  )}
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed pl-8">
                  {st.description}
                </p>

                {st.keyInsight && (
                  <div className="ml-8 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-semibold">Key Insight:</strong> {st.keyInsight}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

