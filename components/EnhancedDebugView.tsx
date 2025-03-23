import React, { useState, useEffect } from 'react';

interface ProcessingLog {
  id: string;
  url_id: string;
  type: string;
  message: string;
  data?: string;
  created_at: string;
}

interface ProcessingStep {
  timestamp: string;
  type: string;
  message: string;
  data?: any;
  id: string;
}

interface EnhancedDebugViewProps {
  urlId: string;
  logs: ProcessingLog[];
  isLoading: boolean;
}

export default function EnhancedDebugView({ urlId, logs, isLoading }: EnhancedDebugViewProps) {
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [apiRequests, setApiRequests] = useState<ProcessingStep[]>([]);
  const [apiResponses, setApiResponses] = useState<ProcessingStep[]>([]);
  const [errors, setErrors] = useState<ProcessingStep[]>([]);
  const [selectedStep, setSelectedStep] = useState<ProcessingStep | null>(null);
  const [activeSection, setActiveSection] = useState<'timeline' | 'requests' | 'responses' | 'errors'>('timeline');

  // Process logs into categorized steps when logs change
  useEffect(() => {
    if (!logs || logs.length === 0) return;

    const steps: ProcessingStep[] = [];
    const requests: ProcessingStep[] = [];
    const responses: ProcessingStep[] = [];
    const errorLogs: ProcessingStep[] = [];

    logs.forEach(log => {
      const step: ProcessingStep = {
        id: log.id,
        timestamp: log.created_at,
        type: log.type,
        message: log.message,
        data: log.data ? JSON.parse(log.data) : undefined
      };

      // Add to the main timeline
      steps.push(step);

      // Categorize by type
      if (log.type === 'api_request') {
        requests.push(step);
      } else if (log.type === 'api_response') {
        responses.push(step);
      } else if (log.type === 'error') {
        errorLogs.push(step);
      }
    });

    setProcessingSteps(steps);
    setApiRequests(requests);
    setApiResponses(responses);
    setErrors(errorLogs);
  }, [logs]);

  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  // Get appropriate styling for each log type
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'info':
        return { icon: 'ℹ️', bgColor: 'bg-blue-50', textColor: 'text-blue-800' };
      case 'error':
        return { icon: '❌', bgColor: 'bg-red-50', textColor: 'text-red-800' };
      case 'api_request':
        return { icon: '⬆️', bgColor: 'bg-purple-50', textColor: 'text-purple-800' };
      case 'api_response':
        return { icon: '⬇️', bgColor: 'bg-green-50', textColor: 'text-green-800' };
      case 'raw_response':
        return { icon: '📦', bgColor: 'bg-yellow-50', textColor: 'text-yellow-800' };
      default:
        return { icon: '📝', bgColor: 'bg-gray-50', textColor: 'text-gray-800' };
    }
  };

  const renderSectionButton = (section: 'timeline' | 'requests' | 'responses' | 'errors', label: string, count: number) => (
    <button
      onClick={() => setActiveSection(section)}
      className={`px-4 py-2 text-sm font-medium ${
        activeSection === section
          ? 'bg-white text-blue-600 border-b-2 border-blue-600'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}
    >
      {label} <span className="ml-1 text-xs bg-gray-200 rounded-full px-2 py-0.5">{count}</span>
    </button>
  );

  const renderJsonData = (data: any) => {
    if (!data) return null;

    try {
      return (
        <pre className="mt-2 p-3 bg-gray-800 text-white rounded text-xs overflow-auto max-h-[400px] whitespace-pre-wrap">
          {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
        </pre>
      );
    } catch (error) {
      return <div className="text-red-500 text-sm mt-2">Error displaying data: {String(error)}</div>;
    }
  };

  // Render step details when selected
  const renderStepDetails = () => {
    if (!selectedStep) return (
      <div className="p-4 text-center text-gray-500">
        Select a step to view details
      </div>
    );

    const { type, message, data, timestamp } = selectedStep;
    const { bgColor, icon } = getTypeStyles(type);

    return (
      <div className={`p-4 rounded-lg ${bgColor} border border-gray-200`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <span className="mr-2">{icon}</span>
            <h3 className="text-md font-medium capitalize">{type.replace('_', ' ')}</h3>
          </div>
          <span className="text-xs text-gray-500">{formatTime(timestamp)}</span>
        </div>
        <p className="text-sm mb-3">{message}</p>
        {data && <div>
          <h4 className="text-sm font-medium mb-1">Details:</h4>
          {renderJsonData(data)}
        </div>}
      </div>
    );
  };

  // Render steps list based on active section
  const renderStepsList = () => {
    let currentSteps: ProcessingStep[] = [];

    switch (activeSection) {
      case 'timeline':
        currentSteps = processingSteps;
        break;
      case 'requests':
        currentSteps = apiRequests;
        break;
      case 'responses':
        currentSteps = apiResponses;
        break;
      case 'errors':
        currentSteps = errors;
        break;
    }

    if (currentSteps.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          No {activeSection} data available
        </div>
      );
    }

    return (
      <div className="overflow-y-auto max-h-[400px]">
        {currentSteps.map((step) => {
          const { bgColor, icon, textColor } = getTypeStyles(step.type);
          const isSelected = selectedStep && selectedStep.id === step.id;

          return (
            <div
              key={step.id}
              className={`p-3 mb-2 rounded-lg border cursor-pointer ${
                isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
              } ${bgColor}`}
              onClick={() => setSelectedStep(step)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <span className="mr-2">{icon}</span>
                  <div>
                    <p className={`font-medium text-sm ${textColor}`}>{step.message}</p>
                    <p className="text-xs text-gray-500">{formatTime(step.timestamp)}</p>
                  </div>
                </div>
                {step.data && (
                  <span className="text-xs bg-gray-200 rounded-full px-2 py-0.5">
                    Has data
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6">
        <div className="flex justify-center items-center h-40">
          <svg className="w-8 h-8 text-gray-400 animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
          </svg>
          <span className="ml-2 text-gray-500">Loading debugging information...</span>
        </div>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6">
        <div className="text-center text-gray-500 p-4">
          No processing logs found for this URL.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-md">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold">Enhanced Debugging View</h3>
        <p className="text-sm text-gray-500 mt-1">
          URL ID: {urlId} | {processingSteps.length} processing steps
        </p>
      </div>

      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex overflow-x-auto">
          {renderSectionButton('timeline', 'Complete Timeline', processingSteps.length)}
          {renderSectionButton('requests', 'API Requests', apiRequests.length)}
          {renderSectionButton('responses', 'API Responses', apiResponses.length)}
          {renderSectionButton('errors', 'Errors', errors.length)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        <div className="border border-gray-200 rounded-lg p-2">
          <h4 className="font-medium text-sm p-2 border-b border-gray-200">
            {activeSection === 'timeline' ? 'Processing Steps' :
             activeSection === 'requests' ? 'API Requests' :
             activeSection === 'responses' ? 'API Responses' : 'Errors'}
          </h4>
          {renderStepsList()}
        </div>

        <div className="border border-gray-200 rounded-lg p-2">
          <h4 className="font-medium text-sm p-2 border-b border-gray-200">Step Details</h4>
          {renderStepDetails()}
        </div>
      </div>
    </div>
  );
} 