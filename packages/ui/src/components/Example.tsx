"use client";

import React, { useState } from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { Input } from './Input';
import { Modal } from './Modal';

export const Example: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (inputError) setInputError('');
  };

  const handleSubmit = () => {
    if (!inputValue.trim()) {
      setInputError('This field is required');
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          SpendlyAI Components
        </h1>
        <p className="text-xl text-gray-600">
          Beautiful, accessible components built with Tailwind CSS
        </p>
      </div>

      {/* Button Examples */}
      <Card title="Button Components">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" size="sm">Small Primary</Button>
            <Button variant="primary" size="md">Medium Primary</Button>
            <Button variant="primary" size="lg">Large Primary</Button>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button variant="secondary" size="md">Secondary</Button>
            <Button variant="outline" size="md">Outline</Button>
            <Button variant="primary" size="md" disabled>Disabled</Button>
          </div>
        </div>
      </Card>

      {/* Input Examples */}
      <Card title="Input Components">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Default Input"
              placeholder="Enter your text here"
              value={inputValue}
              onChange={handleInputChange}
              error={inputError}
            />
            
            <Input
              label="Filled Input"
              variant="filled"
              placeholder="Filled variant"
            />
            
            <Input
              label="Outlined Input"
              variant="outlined"
              placeholder="Outlined variant"
            />
            
            <Input
              label="Input with Helper Text"
              placeholder="This has helper text"
              helperText="This is some helpful information"
            />
          </div>
          
          <Button variant="primary" onClick={handleSubmit}>
            Submit Form
          </Button>
        </div>
      </Card>

      {/* Card Examples */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="Feature 1">
          <p className="text-gray-600 mb-4">
            Real-time monitoring of your AI API usage with detailed analytics.
          </p>
          <Button variant="outline" size="sm">Learn More</Button>
        </Card>
        
        <Card title="Feature 2">
          <p className="text-gray-600 mb-4">
            Smart alerts to prevent unexpected bills and budget overruns.
          </p>
          <Button variant="outline" size="sm">Learn More</Button>
        </Card>
        
        <Card title="Feature 3">
          <p className="text-gray-600 mb-4">
            Multi-project tracking across different AI services and providers.
          </p>
          <Button variant="outline" size="sm">Learn More</Button>
        </Card>
      </div>

      {/* Modal Example */}
      <Card title="Modal Component">
        <p className="text-gray-600 mb-4">
          Click the button below to open a modal dialog.
        </p>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          Open Modal
        </Button>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Welcome to SpendlyAI"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Thank you for your interest in SpendlyAI! This modal demonstrates
            the beautiful Tailwind CSS styling applied to all components.
          </p>
          
          <div className="flex gap-3 pt-4">
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
              Get Started
            </Button>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Learn More
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
