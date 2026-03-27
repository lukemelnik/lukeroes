import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminMiddleware } from "@/middleware/admin";
import {
  getDashboardMetrics,
  getPaidMemberChartData,
  getSignupChartData,
} from "@/server/admin-dashboard.server";

export const getDashboardMetricsFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async () => {
    return getDashboardMetrics();
  });

const chartDaysSchema = z.object({
  days: z.number().int().min(1).max(365),
});

export const getSignupChartDataFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator(chartDaysSchema)
  .handler(async ({ data }) => {
    return getSignupChartData(data.days);
  });

export const getPaidMemberChartDataFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator(chartDaysSchema)
  .handler(async ({ data }) => {
    return getPaidMemberChartData(data.days);
  });
