import { useMemo, useState } from "react";
import { Alert, Box, Button, Skeleton, Stack, TextField } from "@mui/material";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { ChannelCard } from "../components/ChannelCard";
import { ChannelsEmptyState } from "../components/ChannelsEmptyState";
import { CreateChannelDialog } from "../components/CreateChannelDialog";
import { useChannels, useCreateChannel } from "../channels.queries";
import { useCampaigns } from "../../campaigns/campaigns.queries";
import { useSocialAccounts } from "../../social-media/social-accounts.queries";
import { useTeamPermissions } from "../../../shared/hooks/useTeamPermissions";

export function ChannelsListPage() {
  const { canManageChannels } = useTeamPermissions();
  const channelsQuery = useChannels();
  const campaignsQuery = useCampaigns();
  const accountsQuery = useSocialAccounts();
  const createMutation = useCreateChannel();

  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");

  const campaignCounts = useMemo(() => {
    const map = new Map<number, number>();
    for (const campaign of campaignsQuery.data ?? []) {
      if (!campaign.channelId) continue;
      map.set(campaign.channelId, (map.get(campaign.channelId) ?? 0) + 1);
    }
    return map;
  }, [campaignsQuery.data]);

  const accountCounts = useMemo(() => {
    const map = new Map<number, number>();
    for (const account of accountsQuery.data ?? []) {
      for (const linkedChannelId of account.linkedChannelIds) {
        map.set(linkedChannelId, (map.get(linkedChannelId) ?? 0) + 1);
      }
    }
    return map;
  }, [accountsQuery.data]);

  const filteredChannels = useMemo(() => {
    const list = channelsQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (channel) =>
        channel.name.toLowerCase().includes(term) ||
        (channel.description ?? "").toLowerCase().includes(term)
    );
  }, [channelsQuery.data, search]);

  const channels = channelsQuery.data ?? [];

  return (
    <>
      <PageHeader
        eyebrow="OPERATIONS"
        title="Channels"
        subtitle="Operational publishing workspaces. Each channel groups campaigns, branding, accounts and publishing configuration."
        actions={
          channels.length > 0 && canManageChannels ? (
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={() => setCreateOpen(true)}
            >
              New channel
            </Button>
          ) : null
        }
      />

      {channelsQuery.isError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load channels. Please retry.
        </Alert>
      ) : null}

      {channelsQuery.isLoading ? (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
          }}
        >
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Skeleton key={index} variant="rounded" height={180} />
          ))}
        </Box>
      ) : channels.length === 0 ? (
        <ChannelsEmptyState onCreate={canManageChannels ? () => setCreateOpen(true) : undefined} />
      ) : (
        <Stack spacing={2.5}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems="center">
            <TextField
              size="small"
              fullWidth
              placeholder="Search channels..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              InputProps={{
                startAdornment: (
                  <Box sx={{ display: "flex", color: "text.secondary", mr: 1 }}>
                    <Search size={16} />
                  </Box>
                ),
              }}
            />
          </Stack>

          {filteredChannels.length === 0 ? (
            <Alert severity="info">No channels match "{search}".</Alert>
          ) : (
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  lg: "repeat(3, 1fr)",
                },
              }}
            >
              {filteredChannels.map((channel) => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  campaignCount={campaignCounts.get(channel.id) ?? 0}
                  accountCount={accountCounts.get(channel.id) ?? 0}
                />
              ))}
            </Box>
          )}
        </Stack>
      )}

      <CreateChannelDialog
        open={createOpen}
        saving={createMutation.isPending}
        errorMessage={
          createMutation.isError ? (createMutation.error as Error).message : null
        }
        onClose={() => {
          if (!createMutation.isPending) {
            setCreateOpen(false);
            createMutation.reset();
          }
        }}
        onSubmit={(payload) => {
          createMutation.mutate(payload, {
            onSuccess: () => {
              setCreateOpen(false);
              createMutation.reset();
            },
          });
        }}
      />
    </>
  );
}
