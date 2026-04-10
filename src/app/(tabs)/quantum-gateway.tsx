import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { TabContainer } from '@/components/navigation/TabContainer';
import { ThemedText } from '@/components/UI/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { loadQuantumGatewayProjects } from '@/services/quantum-gateway-projects';
import type { QuantumGatewayProjectRecord } from '@/types/quantum-gateway';
import {
	quantumGatewayHighlights,
	quantumGatewayIntegrationNotes,
	quantumGatewayQuickActions,
	quantumGatewaySettingsSections,
} from '@/constants/quantumContent';

const hexToRgba = (hex: string, alpha: number) => {
	const sanitized = hex.replace('#', '');
	const bigint = parseInt(sanitized, 16);
	const r = (bigint >> 16) & 255;
	const g = (bigint >> 8) & 255;
	const b = bigint & 255;
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const shortenId = (value?: string | null) => {
	if (!value) return 'Not set';
	if (value.length <= 10) return value;
	return `${value.slice(0, 8)}...`;
};

export default function QuantumGatewayPage() {
	const router = useRouter();

	const textColor = useThemeColor({}, 'text');
	const tintColor = useThemeColor({}, 'tint');
	const accentColor = useThemeColor({}, 'accent');
	const backgroundColor = useThemeColor({}, 'background');
	const whiteOrBlackColor = useThemeColor({}, 'whiteOrBlack');
	const [liveProjects, setLiveProjects] = useState<QuantumGatewayProjectRecord[]>([]);
	const [isSyncingLiveProjects, setIsSyncingLiveProjects] = useState(true);
	const [liveSyncMessage, setLiveSyncMessage] = useState<string | null>(null);
	const [requiresLiveAuth, setRequiresLiveAuth] = useState(false);
	const [liveSource, setLiveSource] = useState<'supabase' | 'static'>('static');

	useEffect(() => {
		let isActive = true;

		const syncProjects = async () => {
			setIsSyncingLiveProjects(true);
			setLiveSyncMessage(null);

			try {
				const result = await loadQuantumGatewayProjects();
				if (!isActive) return;

				setLiveProjects(result.projects);
				setRequiresLiveAuth(result.requiresAuth);
				setLiveSource(result.source);
				setLiveSyncMessage(result.message ?? null);
			} catch (error) {
				if (!isActive) return;
				setLiveProjects([]);
				setRequiresLiveAuth(false);
				setLiveSource('static');
				setLiveSyncMessage(error instanceof Error ? error.message : 'Unable to load live gateway projects.');
			} finally {
				if (!isActive) return;
				setIsSyncingLiveProjects(false);
			}
		};

		syncProjects();

		return () => {
			isActive = false;
		};
	}, []);

	const primaryProject = liveProjects[0] ?? null;
	const activeProjectCount = useMemo(
		() => liveProjects.filter((project) => project.status === 'active').length,
		[liveProjects]
	);

	const runtimeHighlights = useMemo(() => {
		const loadedCount = liveProjects.length;
		if (loadedCount === 0) return quantumGatewayHighlights;

		return quantumGatewayHighlights.map((item) => {
			if (item.id !== 'usage') {
				return item;
			}

			const label = loadedCount === 1 ? 'project' : 'projects';
			return {
				...item,
				description: `${loadedCount} live gateway ${label} loaded from Identerest with ${activeProjectCount} currently active.`,
				status: liveSource === 'supabase' ? 'Live sync from Identerest' : item.status,
			};
		});
	}, [activeProjectCount, liveProjects.length, liveSource]);

	const runtimeSettingsSections = useMemo(() => {
		if (!primaryProject) {
			return quantumGatewaySettingsSections;
		}

		return quantumGatewaySettingsSections.map((section) => {
			if (section.id === 'routing') {
				return {
					...section,
					rows: section.rows.map((row) => {
						if (row.id === 'slug') {
							return {
								...row,
								value: primaryProject.projectSlug,
							};
						}
						if (row.id === 'path-prefix') {
							return {
								...row,
								value: primaryProject.endpointPathPrefix,
							};
						}
						if (row.id === 'status') {
							return {
								...row,
								value: primaryProject.status,
							};
						}
						return row;
					}),
				};
			}

			if (section.id === 'limits') {
				return {
					...section,
					rows: section.rows.map((row) => {
						if (row.id === 'rpm') {
							return {
								...row,
								value: `${primaryProject.defaultRateLimitPerMinute} requests/min`,
							};
						}
						if (row.id === 'daily') {
							return {
								...row,
								value: `${primaryProject.dailyRequestQuota} requests/day`,
							};
						}
						if (row.id === 'origins') {
							return {
								...row,
								value:
									primaryProject.allowedOrigins.length > 0
										? `${primaryProject.allowedOrigins.length} configured origins`
										: 'No origins configured',
							};
						}
						return row;
					}),
				};
			}

			if (section.id === 'credentials') {
				return {
					...section,
					rows: section.rows.map((row) => {
						if (row.id === 'primary-api-key') {
							return {
								...row,
								value: shortenId(primaryProject.defaultApiKeyId),
							};
						}
						if (row.id === 'ibm-default') {
							return {
								...row,
								value: shortenId(primaryProject.defaultIbmCredentialProfileId),
							};
						}
						return row;
					}),
				};
			}

			return section;
		});
	}, [primaryProject]);

	return (
		<TabContainer
			titleA="Quantum"
			titleB="Gateway"
			leadBody="This page is the gateway display and settings hub. Users can keep one Identerest sign-in while reusing Quantum API keys and IBM credential profiles for gateway-managed projects."
			leadSubBody="Initial UI is now wired and styled to match the rest of your site, with identerest schema focused on gateway project settings and default credential references."
			seo={{
				title: 'Quantum Gateway',
				description:
					'Quantum Gateway settings and landing page for project routing, key/profile bindings, and usage controls tied to one Identerest account.',
				path: '/quantum-gateway',
				keywords: [
					'quantum gateway',
					'quantum api',
					'ibm credentials',
					'project settings',
					'api gateway',
					'identerest',
				],
				type: 'website',
			}}
		>
			<View className="w-full max-w-[1080px]">
				<View
					className="rounded-3xl border border-white/10 p-[4%] mb-4"
					style={{
						backgroundColor: hexToRgba(accentColor, 0.58),
					}}
				>
					<View className="flex-row items-center mb-2">
						<Ionicons name="cloud-done-outline" size={20} color={tintColor} />
						<ThemedText className="ml-2 font-bold text-lg">Live Identerest sync</ThemedText>
					</View>

					{isSyncingLiveProjects ? (
						<View className="flex-row items-center">
							<ActivityIndicator color={tintColor} />
							<ThemedText className="ml-2 opacity-85">Loading gateway projects...</ThemedText>
						</View>
					) : requiresLiveAuth ? (
						<View>
							<ThemedText className="opacity-90 mb-2">
								Sign in with Identerest on the Quantum API page to load your live gateway projects.
							</ThemedText>
							{liveSyncMessage ? (
								<ThemedText className="opacity-75 text-sm">{liveSyncMessage}</ThemedText>
							) : null}
						</View>
					) : liveProjects.length === 0 ? (
						<View>
							<ThemedText className="opacity-90">
								No gateway projects found yet. Create one in Identerest and it will show here.
							</ThemedText>
							{liveSyncMessage ? (
								<ThemedText className="opacity-75 text-sm mt-2">{liveSyncMessage}</ThemedText>
							) : null}
						</View>
					) : (
						<View>
							<ThemedText className="opacity-90 mb-2">
								{liveProjects.length} projects loaded, {activeProjectCount} active.
							</ThemedText>
							{liveProjects.slice(0, 3).map((project) => (
								<View
									key={project.id}
									className="rounded-xl border border-white/10 px-3 py-2 mb-2"
									style={{ backgroundColor: hexToRgba(backgroundColor, 0.2) }}
								>
									<ThemedText className="font-semibold">{project.displayName}</ThemedText>
									<ThemedText className="opacity-80 text-sm">
										/{project.projectSlug} • {project.status}
									</ThemedText>
								</View>
							))}
							{liveSyncMessage ? (
								<ThemedText className="opacity-75 text-sm mt-1">{liveSyncMessage}</ThemedText>
							) : null}
						</View>
					)}
				</View>

				<View
					className="rounded-3xl border border-white/10 p-[4%] mb-4"
					style={{
						backgroundColor: hexToRgba(accentColor, 0.72),
					}}
				>
					<View className="flex-row items-center mb-3">
						<View
							className="w-14 h-14 rounded-2xl items-center justify-center mr-3"
							style={{ backgroundColor: hexToRgba(tintColor, 0.2) }}
						>
							<Ionicons name="shield-checkmark-outline" size={28} color={tintColor} />
						</View>

						<View className="flex-1">
							<ThemedText headingLevel={1} visualHeadingLevel={2} className="font-bold">
								Gateway Portal Overview
							</ThemedText>
							<ThemedText className="opacity-85">
								One account identity, shared credentials, project-level controls.
							</ThemedText>
						</View>
					</View>

					<ThemedText className="leading-6 opacity-90 mb-3">
						Users do not need separate accounts across Quantum API, Gateway, Identerest, Creatisphere, or Higher. This UI is organized around that single-account model and the existing credential records already stored in Identerest.
					</ThemedText>

					<View className="gap-2">
						{quantumGatewayIntegrationNotes.slice(0, 2).map((note) => (
							<View key={note} className="flex-row items-start">
								<Ionicons name="checkmark-circle-outline" size={18} color={tintColor} style={{ marginTop: 2 }} />
								<ThemedText className="ml-2 flex-1 opacity-90">{note}</ThemedText>
							</View>
						))}
					</View>

					<View className="flex-row flex-wrap gap-2 mt-4">
						{quantumGatewayQuickActions.map((action) => (
							<Pressable
								key={action.id}
								className="px-3 py-2 rounded-xl border"
								style={{
									borderColor: hexToRgba(tintColor, 0.35),
									backgroundColor: hexToRgba(backgroundColor, 0.45),
								}}
								onPress={() => router.push(action.route as Href)}
							>
								<View className="flex-row items-center">
									<Ionicons name={action.icon as any} size={16} color={textColor} />
									<ThemedText className="ml-2 font-semibold">{action.label}</ThemedText>
								</View>
							</Pressable>
						))}
					</View>
				</View>

				<View className="mb-4">
					<ThemedText type="subtitle" className="mb-3 text-2xl font-bold">
						What users can manage
					</ThemedText>

					<View className="gap-3">
						{runtimeHighlights.map((item) => (
							<View
								key={item.id}
								className="rounded-2xl border border-white/10 p-4"
								style={{ backgroundColor: hexToRgba(accentColor, 0.55) }}
							>
								<View className="flex-row items-center mb-2">
									<Ionicons name={item.icon as any} size={20} color={tintColor} />
									<ThemedText className="ml-2 font-bold text-lg">{item.title}</ThemedText>
								</View>
								<ThemedText className="opacity-90 leading-6 mb-2">{item.description}</ThemedText>
								<View
									className="self-start px-2 py-1 rounded-lg"
									style={{ backgroundColor: hexToRgba(tintColor, 0.2) }}
								>
									<ThemedText className="text-sm font-semibold">{item.status}</ThemedText>
								</View>
							</View>
						))}
					</View>
				</View>

				<View className="mb-4">
					<ThemedText type="subtitle" className="mb-3 text-2xl font-bold">
						Settings preview
					</ThemedText>

					<View className="gap-3">
						{runtimeSettingsSections.map((section) => (
							<View
								key={section.id}
								className="rounded-2xl border border-white/10 p-4"
								style={{ backgroundColor: hexToRgba(accentColor, 0.55) }}
							>
								<ThemedText className="font-bold text-xl mb-1">{section.title}</ThemedText>
								<ThemedText className="opacity-85 mb-3">{section.description}</ThemedText>

								<View className="rounded-xl overflow-hidden border border-white/10">
									{section.rows.map((row, index) => (
										<View
											key={row.id}
											className="px-3 py-2"
											style={{
												backgroundColor:
													index % 2 === 0 ? hexToRgba(backgroundColor, 0.2) : 'transparent',
											}}
										>
											<View className="flex-row items-start justify-between">
												<ThemedText className="font-semibold flex-1 mr-3">{row.label}</ThemedText>
												<ThemedText className="font-semibold">{row.value}</ThemedText>
											</View>
											{row.hint ? (
												<ThemedText className="opacity-75 text-sm mt-1">{row.hint}</ThemedText>
											) : null}
										</View>
									))}
								</View>
							</View>
						))}
					</View>
				</View>

				<View
					className="rounded-2xl border border-white/10 p-4"
					style={{ backgroundColor: hexToRgba(accentColor, 0.55) }}
				>
					<ThemedText type="subtitle" className="mb-3 text-xl font-bold">
						Data flow model
					</ThemedText>

					<View className="gap-2">
						{quantumGatewayIntegrationNotes.map((note, index) => (
							<View key={note} className="flex-row items-start">
								<View
									className="w-6 h-6 rounded-full items-center justify-center mr-2"
									style={{ backgroundColor: hexToRgba(tintColor, 0.22) }}
								>
									<ThemedText className="text-xs font-bold" style={{ color: whiteOrBlackColor }}>
										{index + 1}
									</ThemedText>
								</View>
								<ThemedText className="flex-1 leading-6">{note}</ThemedText>
							</View>
						))}
					</View>
				</View>
			</View>
		</TabContainer>
	);
}
