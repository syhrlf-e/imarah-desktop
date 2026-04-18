import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersService } from "@/services/usersService";
import { User } from "@/types";
import { invoke } from "@tauri-apps/api/core";

export const useUsersData = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      return await invoke<User[]>("list_users");
    },
  });
};

export const useUsersMutation = () => {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (payload: Partial<User> & { password?: string, password_confirmation?: string, seckey?: string }) => {
      return await usersService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      return await usersService.remove(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  return { create, remove };
};
