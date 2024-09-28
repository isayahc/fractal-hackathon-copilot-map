import React, { useState } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface MapMarker {
  id: number;
  lat: number;
  lng: number;
  name: string;
  description: string;
  createdAt: Date;
}

interface AIChatbotProps {
  markers: MapMarker[];
  onRecommendation: (lat: number, lng: number, name: string, description: string) => void;
}

export function AIChatbot({ markers, onRecommendation }: AIChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hello! I can help you discover new interesting locations based on your existing markers. What kind of place are you looking for?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      setMessages(prev => [...prev, { role: 'user', content: input }]);
      generateRecommendation(input);
      setInput('');
    }
  }

  const generateRecommendation = (query: string) => {
    // Simulate AI processing
    setTimeout(() => {
      const recommendation = simulateAIRecommendation(query, markers);
      setMessages(prev => [...prev, { role: 'assistant', content: recommendation.message }]);
      
      if (recommendation.location) {
        onRecommendation(
          recommendation.location.lat,
          recommendation.location.lng,
          recommendation.location.name,
          recommendation.location.description
        );
      }
    }, 1000);
  }

  const simulateAIRecommendation = (query: string, existingMarkers: MapMarker[]) => {
    // This is a very basic simulation. In a real AI system, this would be much more sophisticated.
    const keywords = query.toLowerCase().split(' ');
    
    if (keywords.includes('restaurant') || keywords.includes('food')) {
      return {
        message: "Based on your interests, I recommend trying 'The Culinary Corner'. It's a fusion restaurant that combines flavors from your existing markers.",
        location: {
          lat: existingMarkers[0]?.lat + 0.01 || 40.7128,
          lng: existingMarkers[0]?.lng + 0.01 || -74.0060,
          name: 'The Culinary Corner',
          description: 'A fusion restaurant combining flavors from various cuisines.'
        }
      };
    } else if (keywords.includes('park') || keywords.includes('nature')) {
      return {
        message: "How about visiting 'Greenview Park'? It's a beautiful green space not far from your marked locations.",
        location: {
          lat: existingMarkers[0]?.lat - 0.01 || 40.7128,
          lng: existingMarkers[0]?.lng - 0.01 || -74.0060,
          name: 'Greenview Park',
          description: 'A serene park with walking trails and picnic areas.'
        }
      };
    } else {
      return {
        message: "I'm sorry, I couldn't find a specific recommendation based on your query. Could you provide more details about what you're looking for?",
        location: null
      };
    }
  }

  return (
    <div className="flex flex-col h-[400px] border rounded-lg p-4">
      <ScrollArea className="flex-grow mb-4">
        {messages.map((message, index) => (
          <div key={index} className={`mb-2 ${message.role === 'assistant' ? 'text-blue-600' : 'text-green-600'}`}>
            <strong>{message.role === 'assistant' ? 'AI: ' : 'You: '}</strong>
            {message.content}
          </div>
        ))}
      </ScrollArea>
      <div className="flex space-x-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your message here..."
        />
        <Button onClick={handleSend}>Send</Button>
      </div>
    </div>
  );
}