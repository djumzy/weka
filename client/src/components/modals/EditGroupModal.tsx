import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGroupSchema, type InsertGroup, type Group } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group;
}

export function EditGroupModal({ open, onOpenChange, group }: EditGroupModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertGroup>({
    resolver: zodResolver(insertGroupSchema.omit({ createdBy: true })),
    defaultValues: {
      name: group.name || "",
      description: group.description || "",
      location: group.location || "",
      registrationNumber: group.registrationNumber || "",
      meetingFrequency: group.meetingFrequency || "monthly",
      maxMembers: group.maxMembers || 30,
      cycleMonths: group.cycleMonths || 12,
      savingPerShare: group.savingPerShare || "0",
      interestRate: group.interestRate || "5.0",
      welfareAmount: group.welfareAmount || "0",
      mainActivity: group.mainActivity || "",
      otherActivities: group.otherActivities || "",
      registrationDate: group.registrationDate || new Date().toISOString().split('T')[0],
      hasRunningBusiness: group.hasRunningBusiness || false,
      businessName: group.businessName || "",
      businessLocation: group.businessLocation || "",
      currentInput: group.currentInput || "",
      isActive: group.isActive !== false,
    },
  });

  // Reset form when group changes
  useEffect(() => {
    if (group) {
      form.reset({
        name: group.name || "",
        description: group.description || "",
        location: group.location || "",
        registrationNumber: group.registrationNumber || "",
        meetingFrequency: group.meetingFrequency || "monthly",
        maxMembers: group.maxMembers || 30,
        cycleMonths: group.cycleMonths || 12,
        savingPerShare: group.savingPerShare || "0",
        interestRate: group.interestRate || "5.0",
        welfareAmount: group.welfareAmount || "0",
        mainActivity: group.mainActivity || "",
        otherActivities: group.otherActivities || "",
        registrationDate: group.registrationDate || new Date().toISOString().split('T')[0],
        hasRunningBusiness: group.hasRunningBusiness || false,
        businessName: group.businessName || "",
        businessLocation: group.businessLocation || "",
        currentInput: group.currentInput || "",
        isActive: group.isActive !== false,
      });
    }
  }, [group, form]);

  const mutation = useMutation({
    mutationFn: async (data: InsertGroup) => {
      const response = await apiRequest("PUT", `/api/groups/${group.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups", group.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Group updated successfully",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update group",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertGroup) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="edit-group-modal">
        <DialogHeader>
          <DialogTitle>Edit Group: {group.name}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="registrationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Registration</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        data-testid="input-registration-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name of The Group</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="......................................................................"
                        data-testid="input-group-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe the group's purpose and goals..."
                        data-testid="textarea-description"
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
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Group location"
                        data-testid="input-location"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="registrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Official registration number"
                        data-testid="input-registration-number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="meetingFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meeting Frequency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-meeting-frequency">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxMembers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Members</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                        data-testid="input-max-members"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cycleMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cycle Duration (Months)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                        data-testid="input-cycle-months"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="savingPerShare"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saving Per Share (UGX)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Amount per share"
                        data-testid="input-saving-per-share"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="interestRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interest Rate (%)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Monthly interest rate"
                        data-testid="input-interest-rate"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="welfareAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Welfare Amount (UGX)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Monthly welfare contribution"
                        data-testid="input-welfare-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mainActivity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Main Activity</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Primary business activity"
                        data-testid="input-main-activity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="otherActivities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other Activities</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Additional activities..."
                        data-testid="textarea-other-activities"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="hasRunningBusiness"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Has Running Business</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Does the group have an active business?
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-has-business"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("hasRunningBusiness") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Name of the business"
                            data-testid="input-business-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Location</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Where is the business located"
                            data-testid="input-business-location"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="currentInput"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Input</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Current group inputs and resources..."
                        data-testid="textarea-current-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Group</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Is this group currently active?
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-is-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                data-testid="button-update-group"
              >
                {mutation.isPending ? "Updating..." : "Update Group"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}