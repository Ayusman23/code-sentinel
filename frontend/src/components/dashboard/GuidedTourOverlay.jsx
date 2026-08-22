import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Sparkles, Shield, Cpu, Activity, Database } from 'lucide-react';

export const GuidedTourOverlay = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to CodeSentinel V2.0',
      subtitle: 'Zero-Trust DevSecOps Command Center',
      icon: Shield,
      color: 'text-cyber-accent',
      description: 'CodeSentinel automatically triages GitHub Pull Requests using sub-millisecond in-flight Shannon entropy secret interception, deterministic AST contract checking, and Google Gemini LLM reasoning.'
    },
    {
      title: '1. PR Triage Pipeline & Blast Radius',
      subtitle: '5-Axis Failure Surface Breakdown',
      icon: Activity,
      color: 'text-cyber-medium',
      description: 'Inspect open pull requests to analyze 5-axis failure risk (Dependency Depth, Public API Surface, Persistence Schema changes, RBAC Exposure, and Cyclomatic Complexity Delta).'
    },
    {
      title: '2. One-Click GitHub Markdown Suggestions',
      subtitle: 'Test-Backed Security Patches',
      icon: Cpu,
      color: 'text-cyber-low',
      description: 'Every detected vulnerability includes a committable GitHub Markdown suggestion (```suggestion) alongside an automated Jest/PyTest verification snippet to prevent regressions.'
    },
    {
      title: '3. Role-Based Governance & Audit Matrix',
      subtitle: 'Zero-Trust Security & SOC 2 Compliance',
      icon: Database,
      color: 'text-cyber-accentStrong',
      description: 'Role-based access control enforces strict clearance boundaries across SecOps Leads, Security Engineers, and Developers. All actions are cryptographically logged with JSON export capability.'
    }
  ];

  if (!isOpen) return null;

  const active = steps[currentStep];
  const Icon = active.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('codesentinel_tour_seen', 'true');
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('codesentinel_tour_seen', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cyber-dark/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="panel border border-cyber-accent/40 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Top Progress Bar & Close */}
        <div className="flex items-center justify-between border-b border-cyber-border pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-accent"></span>
            </span>
            <span className="text-xs font-mono font-bold text-cyber-accent uppercase tracking-wider">
              Guided Tour ({currentStep + 1} of {steps.length})
            </span>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 rounded hover:bg-cyber-cardHover text-cyber-muted hover:text-cyber-text transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Body */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-cyber-card border border-cyber-border flex items-center justify-center ${active.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-mono text-cyber-text">
                {active.title}
              </h3>
              <div className="text-xs font-mono text-cyber-accent">
                {active.subtitle}
              </div>
            </div>
          </div>

          <p className="text-xs text-cyber-muted leading-relaxed font-sans">
            {active.description}
          </p>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep ? 'w-6 bg-cyber-accent' : 'w-2 bg-cyber-border'
                }`}
              ></div>
            ))}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-cyber-border text-xs font-mono">
          <button
            onClick={handleDismiss}
            className="text-cyber-muted hover:text-cyber-text transition-colors"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="px-3 py-1.5 rounded bg-cyber-card hover:bg-cyber-cardHover border border-cyber-border text-cyber-text flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-4 py-1.5 rounded bg-cyber-accent hover:bg-cyber-accentStrong text-cyber-dark font-bold flex items-center gap-1 transition-colors"
            >
              <span>{currentStep === steps.length - 1 ? 'Get Started' : 'Next'}</span>
              {currentStep === steps.length - 1 ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
