import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface UrlDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  url: {
    id: string;
    url: string;
    pageTitle: string;
    dateAccessed: string;
    summary: string;
    processingStatus?: string;
    tags: string[];
  } | null;
}

export default function UrlDetailsModal({ isOpen, onClose, onDelete, url }: UrlDetailsModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  
  if (!url) return null;

  // Format the date for display
  const formattedDate = url.dateAccessed ? new Date(url.dateAccessed).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Unknown date';
  
  const handleDelete = async () => {
    if (!url) return;
    
    setIsDeleting(true);
    try {
      await onDelete(url.id);
      onClose();
    } catch (error) {
      console.error('Error deleting URL:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog className="fixed z-10 inset-0 overflow-y-auto" onClose={onClose}>
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
            &#8203;
          </span>
          
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <Dialog.Panel className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 sm:mt-5">
                  <Dialog.Title className="text-lg leading-6 font-medium text-gray-900">
                    {url.pageTitle}
                  </Dialog.Title>
                  
                  <div className="mt-4">
                    <a 
                      href={url.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-indigo-600 hover:text-indigo-900 break-all"
                    >
                      {url.url}
                    </a>
                  </div>
                  
                  <div className="mt-6 border-t border-gray-200 pt-4">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Summary</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {url.summary && url.summary.trim() !== '' ? url.summary : 'No summary available'}
                        </dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Date Saved</dt>
                        <dd className="mt-1 text-sm text-gray-900">{formattedDate}</dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            url.processingStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {url.processingStatus || 'completed'}
                          </span>
                        </dd>
                      </div>
                      
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Tags</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          <div className="flex flex-wrap gap-2">
                            {url.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                              >
                                {tag}
                              </span>
                            ))}
                            {url.tags.length === 0 && <span className="text-gray-500">No tags</span>}
                          </div>
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                  onClick={onClose}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-md border border-red-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-1 sm:text-sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 