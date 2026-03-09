import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CMSSettings {
  [key: string]: string;
}

export const useCMSSettings = () => {
  return useQuery({
    queryKey: ["cms-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("key, value");
      if (error) throw error;
      const settings: CMSSettings = {};
      data?.forEach((row) => {
        settings[row.key] = row.value;
      });
      return settings;
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  });
};
