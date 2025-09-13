import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertGroupSchema, type InsertGroup } from "@shared/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface NewGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewGroupModal({ open, onOpenChange }: NewGroupModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertGroup>({
    resolver: zodResolver(insertGroupSchema.omit({ createdBy: true })),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      registrationNumber: "",
      meetingFrequency: "monthly",
      maxMembers: 30,
      cycleMonths: 12,
      savingPerShare: "0",
      interestRate: "5.0",
      welfareAmount: "0",
      mainActivity: "",
      otherActivities: "",
      registrationDate: new Date().toISOString().split('T')[0],
      hasRunningBusiness: false,
      businessName: "",
      businessLocation: "",
      currentInput: "",
      isActive: true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertGroup) => {
      const response = await apiRequest("POST", "/api/groups", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Group created successfully",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create group",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertGroup) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full" data-testid="new-group-modal">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Create New Group</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="registrationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
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
              </div>

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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter location"
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
                          placeholder="Enter registration number"
                          data-testid="input-registration-number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="maxMembers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Members</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="5"
                          max="50"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                      <FormLabel>Number of Months per Cycle</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="6"
                          max="24"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                      <FormLabel>Current Saving (if available)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...field}
                          placeholder="0.00"
                          data-testid="input-current-saving"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="interestRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Interest Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="50"
                          step="0.1"
                          {...field}
                          placeholder="5.0"
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
                      <FormLabel>Welfare Amount (UGX per member)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="1000"
                          {...field}
                          placeholder="10000"
                          data-testid="input-welfare-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Activities */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="mainActivity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What is your Main Activity as a Group</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe the main activity of the group"
                        rows={3}
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
                    <FormLabel>Other Activities (if there are any)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe other activities if any"
                        rows={3}
                        data-testid="input-other-activities"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Business Information */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="hasRunningBusiness"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Do the group have a running business (Business Group)?</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === "true")} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger data-testid="select-has-business">
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("hasRunningBusiness") && (
                <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name of the Business</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter business name"
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
                        <FormLabel>Its Location</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter business location"
                            data-testid="input-business-location"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currentInput"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Input (funds, manpower, services, etc.)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Describe current input in terms of funds, manpower, services, etc."
                            rows={3}
                            data-testid="input-current-input"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-6">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-group"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={mutation.isPending}
                data-testid="button-create-group"
              >
                {mutation.isPending ? "Creating..." : "Create Group"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
