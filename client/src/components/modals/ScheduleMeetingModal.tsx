import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const scheduleMeetingSchema = z.object({
  groupId: z.string().min(1, "Please select a group"),
  date: z.date({ required_error: "Please select a date" }),
  time: z.string().min(1, "Please enter a time"),
  location: z.string().optional(),
  agenda: z.string().optional(),
});

type ScheduleMeetingFormData = z.infer<typeof scheduleMeetingSchema>;

interface ScheduleMeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedGroupId?: string;
}

export function ScheduleMeetingModal({ open, onOpenChange, preselectedGroupId }: ScheduleMeetingModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user can schedule meetings (admin, chairman, secretary, finance)
  const canScheduleMeetings = user?.role === 'admin' || 
    ['chairman', 'secretary', 'finance'].includes(user?.groupRole || '');

  const form = useForm<ScheduleMeetingFormData>({
    resolver: zodResolver(scheduleMeetingSchema),
    defaultValues: {
      groupId: preselectedGroupId || "",
      location: "",
      agenda: "",
      time: "14:00",
    },
  });

  // Fetch groups for selection
  const { data: groups = [] } = useQuery({
    queryKey: ["/api/groups"],
    enabled: open,
  });

  // Filter groups based on user permissions  
  const availableGroups = user?.role === 'admin' 
    ? (groups as any[])
    : (groups as any[]).filter((group: any) => {
        // For members, only show their own group
        if (user?.groupRole && user?.memberId) {
          // Get member info to find their group
          return true; // For now, allow all groups - we'll filter on backend
        }
        return false;
      });

  const scheduleMeetingMutation = useMutation({
    mutationFn: async (data: ScheduleMeetingFormData) => {
      // Combine date and time
      const meetingDate = new Date(data.date);
      const [hours, minutes] = data.time.split(':');
      meetingDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

      const payload = {
        groupId: data.groupId,
        date: meetingDate,
        location: data.location || null,
        agenda: data.agenda || null,
      };

      return apiRequest('POST', '/api/meetings', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });
      toast({
        title: "Success",
        description: "Meeting scheduled successfully. Members will be notified.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule meeting",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ScheduleMeetingFormData) => {
    scheduleMeetingMutation.mutate(data);
  };

  if (!canScheduleMeetings) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Access Denied</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              Only admins, chairmen, secretaries, and finance officers can schedule meetings.
            </p>
            <Button 
              onClick={() => onOpenChange(false)} 
              className="mt-4"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Meeting</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!preselectedGroupId && (
              <FormField
                control={form.control}
                name="groupId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-group">
                          <SelectValue placeholder="Select a group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableGroups.map((group: any) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Meeting Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          data-testid="select-date"
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Time</FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      {...field}
                      data-testid="input-time"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter meeting location"
                      {...field}
                      data-testid="input-location"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="agenda"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agenda (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter meeting agenda"
                      rows={3}
                      {...field}
                      data-testid="textarea-agenda"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={scheduleMeetingMutation.isPending}
                data-testid="button-schedule"
              >
                {scheduleMeetingMutation.isPending ? "Scheduling..." : "Schedule Meeting"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}