import { useState, useEffect } from 'react';
import { ProgressionService } from '../plugins/progression/services/progression-service';
import { RequirementStatus } from '../plugins/progression/services/progression-service';
import { agentLevels, AgentLevel } from '@/config/agent-levels';

// Create a mock runtime for client-side use
const createMockRuntime = () => {
    const services = new Map();

    return {
        getService: (type: string) => services.get(type),
        registerService: (type: string, service: any) => {
            services.set(type, service);
            return service;
        },
        emitEvent: async (event: string, params: any) => {
            console.log(`Emitting event ${event} with params:`, params);
            return Promise.resolve();
        }
    };
};

export interface ProgressionState {
    currentLevel: number;
    isInitialized: boolean;
    error: Error | null;
    requirementsCompleted: RequirementStatus;
    levelConfig: AgentLevel;
    canLevelUp: boolean;
}

export function useProgressionPlugin() {
    const [progressionService, setProgressionService] = useState<ProgressionService | null>(null);
    const [state, setState] = useState<ProgressionState>({
        currentLevel: 1,
        isInitialized: false,
        error: null,
        requirementsCompleted: {},
        levelConfig: agentLevels[1],
        canLevelUp: false
    });

    useEffect(() => {
        const initializePlugin = async () => {
            try {
                // Create a mock runtime
                const mockRuntime = createMockRuntime();

                // Initialize the service
                const service = await ProgressionService.start(mockRuntime as any);
                mockRuntime.registerService(ProgressionService.serviceType, service);
                setProgressionService(service);

                // Initialize the state
                const currentLevel = service.getCurrentLevel();
                const levelConfig = service.getLevelConfig();
                const requirementsCompleted = service.getCompletedRequirements();
                const canLevelUp = service.checkLevelUpEligibility();

                setState({
                    currentLevel,
                    isInitialized: true,
                    error: null,
                    requirementsCompleted,
                    levelConfig,
                    canLevelUp
                });
            } catch (err) {
                console.error('Error initializing progression plugin:', err);
                setState(prev => ({
                    ...prev,
                    error: err instanceof Error ? err : new Error(String(err))
                }));
            }
        };

        initializePlugin();

        // Cleanup function
        return () => {
            progressionService?.stop();
        };
    }, []);

    // Function to mark a requirement as complete
    const markRequirementComplete = async (requirementKey: string): Promise<boolean> => {
        if (!progressionService) {
            throw new Error('Progression service not initialized');
        }

        const canLevelUp = await progressionService.markRequirementComplete(requirementKey);

        // Update the state
        setState({
            currentLevel: progressionService.getCurrentLevel(),
            isInitialized: true,
            error: null,
            requirementsCompleted: progressionService.getCompletedRequirements(),
            levelConfig: progressionService.getLevelConfig(),
            canLevelUp: progressionService.checkLevelUpEligibility()
        });

        return canLevelUp;
    };

    // Function to level up
    const levelUp = async (): Promise<boolean> => {
        if (!progressionService) {
            throw new Error('Progression service not initialized');
        }

        if (!progressionService.checkLevelUpEligibility()) {
            return false;
        }

        const success = await progressionService.levelUp();

        if (success) {
            // Update the state
            setState({
                currentLevel: progressionService.getCurrentLevel(),
                isInitialized: true,
                error: null,
                requirementsCompleted: progressionService.getCompletedRequirements(),
                levelConfig: progressionService.getLevelConfig(),
                canLevelUp: progressionService.checkLevelUpEligibility()
            });
        }

        return success;
    };

    // Function to reset progression
    const resetProgression = async (): Promise<void> => {
        if (!progressionService) {
            throw new Error('Progression service not initialized');
        }

        await progressionService.resetProgression();

        // Update the state
        setState({
            currentLevel: progressionService.getCurrentLevel(),
            isInitialized: true,
            error: null,
            requirementsCompleted: progressionService.getCompletedRequirements(),
            levelConfig: progressionService.getLevelConfig(),
            canLevelUp: progressionService.checkLevelUpEligibility()
        });
    };

    return {
        ...state,
        markRequirementComplete,
        levelUp,
        resetProgression,
        isRequirementCompleted: (requirementKey: string) =>
            progressionService?.isRequirementCompleted(requirementKey) || false,
        getCurrentRequirements: () =>
            progressionService?.getCurrentRequirements() || []
    };
} 