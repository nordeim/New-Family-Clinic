// @/components/feedback/FeedbackWidget.tsx
"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/Button";
import { Modal } from "@mantine/core";
import { MessageSquare } from "lucide-react";
import { api } from "@/lib/trpc/client";
import { Textarea } from "@/components/ui/textarea"; // Use canonical lowercase path
import { StarRating } from "@/components/ui/StarRating"; // Assuming this component exists
import { getMutationLoading } from "@/lib/utils";

export function FeedbackWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const submitMutation = api.feedback.submitFeedback.useMutation({
    onSuccess: () => {
      setIsSubmitted(true);
      // Reset after a delay
      setTimeout(() => {
        setIsOpen(false);
        setIsSubmitted(false);
        setRating(0);
        setFeedbackText("");
      }, 3000);
    },
  });

  // Only render the widget if the user is logged in
  if (!user) {
    return null;
  }

  const handleSubmit = () => {
    submitMutation.mutate({
      rating: rating > 0 ? rating : undefined,
      feedbackText: feedbackText || undefined,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
    });
  };

  return (
    <>
      <Button
        aria-label="Give feedback"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
        size="icon"
      >
        <MessageSquare />
      </Button>

      <Modal opened={isOpen} onClose={() => setIsOpen(false)} title="Share Your Feedback" centered>
        {isSubmitted ? (
          <div className="text-center py-8">
            <h3 className="font-semibold text-lg">Thank you!</h3>
            <p className="text-neutral-600 mt-2">Your feedback helps us improve.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="font-medium">How would you rate your experience?</label>
              <StarRating rating={rating} onRatingChange={setRating} />
            </div>
            <div>
              <label htmlFor="feedback-text" className="font-medium">
                Any additional comments?
              </label>
              <Textarea
                id="feedback-text"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Tell us what you think..."
                rows={4}
              />
            </div>
            {submitMutation.error && (
              <p className="text-sm text-red-500">{submitMutation.error.message}</p>
            )}
            <Button
              className="w-full"
              onClick={handleSubmit}
              isLoading={getMutationLoading(submitMutation)}
            >
              Submit Feedback
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}
