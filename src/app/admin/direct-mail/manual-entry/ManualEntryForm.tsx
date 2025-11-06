"use client";

/**
 * @file src/app/admin/direct-mail/manual-entry/ManualEntryForm.tsx
 * Client component that renders the USPS manual campaign entry form.
 */

import { useEffect, useMemo, useRef, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, format, parseISO } from "date-fns";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { manualEntrySchema, type ManualEntryInput } from "./schema";
import { createManualCampaign } from "./actions";

interface ManualEntryFormProps {
  clients: Array<{ id: string; clientName: string }>;
}

type CountsField = "totalScanned" | "numberDelivered" | "finalScanCount";

const formatDateForInput = (value?: Date) => {
  if (!value || Number.isNaN(value.getTime())) {
    return "";
  }
  return format(value, "yyyy-MM-dd");
};

export function ManualEntryForm({ clients }: ManualEntryFormProps) {
  const [isPending, startTransition] = useTransition();
  const scanDateManuallyEdited = useRef(false);
  const countsManuallyEdited = useRef<Record<CountsField, boolean>>({
    totalScanned: false,
    numberDelivered: false,
    finalScanCount: false,
  });

  const initialMailDate = useMemo(() => new Date(), []);

  const form = useForm<ManualEntryInput>({
    // Coercion + superRefine widen the inferred input type; cast keeps the resolver aligned
    resolver: zodResolver(manualEntrySchema) as Resolver<ManualEntryInput>,
    defaultValues: {
      clientId: clients[0]?.id ?? "",
      campaignName: "",
      reportId: "",
      mailDate: initialMailDate,
      scanDate: addDays(initialMailDate, 3),
      pieces: 0,
      totalScanned: 0,
      numberDelivered: 0,
      finalScanCount: 0,
      percentScanned: 100,
      percentDelivered: 100,
      percentFinalScan: 100,
      percentOnTime: 100,
    },
  });

  const pieces = form.watch("pieces");
  const mailDate = form.watch("mailDate");

  useEffect(() => {
    const current = form.getValues("clientId");
    if (!current && clients[0]) {
      form.setValue("clientId", clients[0].id);
    }
  }, [clients, form]);

  useEffect(() => {
    if (
      typeof pieces === "number" &&
      !Number.isNaN(pieces) &&
      pieces >= 0
    ) {
      (["totalScanned", "numberDelivered", "finalScanCount"] as CountsField[]).forEach(
        (field) => {
          if (!countsManuallyEdited.current[field]) {
            form.setValue(field, pieces, { shouldValidate: true });
          }
        },
      );
    }
  }, [pieces, form]);

  useEffect(() => {
    if (!mailDate || Number.isNaN(mailDate.getTime())) {
      return;
    }
    if (!scanDateManuallyEdited.current) {
      form.setValue("scanDate", addDays(mailDate, 3), { shouldValidate: true });
    }
  }, [mailDate, form]);

  const handleReset = () => {
    const resetMailDate = new Date();
    const currentClient = form.getValues("clientId") || clients[0]?.id || "";
    const defaults: ManualEntryInput = {
      clientId: currentClient,
      campaignName: "",
      reportId: "",
      mailDate: resetMailDate,
      scanDate: addDays(resetMailDate, 3),
      pieces: 0,
      totalScanned: 0,
      numberDelivered: 0,
      finalScanCount: 0,
      percentScanned: 100,
      percentDelivered: 100,
      percentFinalScan: 100,
      percentOnTime: 100,
    };
    form.reset(defaults);
    scanDateManuallyEdited.current = false;
    countsManuallyEdited.current = {
      totalScanned: false,
      numberDelivered: false,
      finalScanCount: false,
    };
  };

  const handleSubmit = form.handleSubmit((values) => {
    if (!values.clientId) {
      toast.error("Please select a client before submitting.");
      return;
    }

    startTransition(() => {
      (async () => {
        const result = await createManualCampaign(values);

        if (result?.error) {
          toast.error(result.error);
          return;
        }

        toast.success("Campaign and summary created.");
        handleReset();
      })();
    });
  });

  const handleReportIdGenerate = () => {
    const randomId = Math.floor(100000 + Math.random() * 900000).toString();
    form.setValue("reportId", randomId, { shouldValidate: true });
  };

  const disableForm = clients.length === 0;

  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="space-y-4">
            <header className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-900">
                Campaign Details
              </h2>
              <p className="text-sm text-muted-foreground">
                Choose the client and describe the new USPS campaign.
              </p>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={disableForm || isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.clientName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="campaignName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="25-1049"
                        disabled={disableForm || isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-[2fr_auto]">
              <FormField
                control={form.control}
                name="reportId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report ID</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          {...field}
                          inputMode="numeric"
                          placeholder="6 digit ID"
                          maxLength={6}
                          disabled={disableForm || isPending}
                          onChange={(event) => {
                            const value = event.target.value.replace(/\D/g, "");
                            field.onChange(value.slice(0, 6));
                          }}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleReportIdGenerate}
                        disabled={disableForm || isPending}
                      >
                        Generate
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <FormLabel>Send Date</FormLabel>
                <Input
                  value={formatDateForInput(mailDate)}
                  readOnly
                  disabled
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <header className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-900">
                Summary Row (Day 1)
              </h2>
              <p className="text-sm text-muted-foreground">
                Provide the first day&apos;s performance stats. Counts default to
                the number of mailed pieces.
              </p>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="mailDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mail Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={formatDateForInput(field.value)}
                        onChange={(event) => {
                          const value = event.target.value;
                          if (!value) {
                            field.onChange(undefined);
                            return;
                          }
                          field.onChange(parseISO(value));
                        }}
                        disabled={disableForm || isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="scanDate"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Scan Date</FormLabel>
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-xs"
                        onClick={() => {
                          scanDateManuallyEdited.current = false;
                          if (mailDate && !Number.isNaN(mailDate.getTime())) {
                            form.setValue("scanDate", addDays(mailDate, 3), {
                              shouldValidate: true,
                            });
                          }
                        }}
                        disabled={disableForm || isPending}
                      >
                        Reset to +3 days
                      </Button>
                    </div>
                    <FormControl>
                      <Input
                        type="date"
                        value={formatDateForInput(field.value)}
                        onChange={(event) => {
                          const value = event.target.value;
                          scanDateManuallyEdited.current = true;
                          if (!value) {
                            field.onChange(undefined);
                            return;
                          }
                          field.onChange(parseISO(value));
                        }}
                        disabled={disableForm || isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="pieces"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pieces</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value ?? ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          field.onChange(
                            value === "" ? undefined : Number(value),
                          );
                        }}
                        disabled={disableForm || isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="totalScanned"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Scanned</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value ?? ""}
                        onChange={(event) => {
                          countsManuallyEdited.current.totalScanned = true;
                          const value = event.target.value;
                          field.onChange(
                            value === "" ? undefined : Number(value),
                          );
                        }}
                        disabled={disableForm || isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="numberDelivered"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number Delivered</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value ?? ""}
                        onChange={(event) => {
                          countsManuallyEdited.current.numberDelivered = true;
                          const value = event.target.value;
                          field.onChange(
                            value === "" ? undefined : Number(value),
                          );
                        }}
                        disabled={disableForm || isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="finalScanCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Final Scan Count</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value ?? ""}
                        onChange={(event) => {
                          countsManuallyEdited.current.finalScanCount = true;
                          const value = event.target.value;
                          field.onChange(
                            value === "" ? undefined : Number(value),
                          );
                        }}
                        disabled={disableForm || isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="percentScanned"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Percent Scanned</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={field.value ?? ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          field.onChange(
                            value === "" ? undefined : Number(value),
                          );
                        }}
                        disabled={disableForm || isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="percentDelivered"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Percent Delivered</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={field.value ?? ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          field.onChange(
                            value === "" ? undefined : Number(value),
                          );
                        }}
                        disabled={disableForm || isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="percentFinalScan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Percent Final Scan</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={field.value ?? ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          field.onChange(
                            value === "" ? undefined : Number(value),
                          );
                        }}
                        disabled={disableForm || isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="percentOnTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Percent On Time</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={field.value ?? ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          field.onChange(
                            value === "" ? undefined : Number(value),
                          );
                        }}
                        disabled={disableForm || isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          {disableForm && (
            <p className="text-sm text-destructive">
              No USPS clients are available. Create a client before adding a
              campaign.
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isPending}
            >
              Reset
            </Button>
            <Button type="submit" disabled={isPending || disableForm}>
              {isPending ? "Saving..." : "Create Campaign"}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}
