/**
 * Chevalier Mutation Hooks
 * Deployment lifecycle actions
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  deployStrategy,
  pauseDeployment,
  resumeDeployment,
  stopDeployment,
  undeployDeployment,
  DeployStrategyRequest
} from '@/lib/api/chevalier'
import { chevalierKeys } from '../queries/use-chevalier-queries'

export const useDeployStrategy = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: DeployStrategyRequest) => deployStrategy(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: chevalierKeys.deployments() })
      toast.success(`Strategy deployed successfully (v${data.version})`)
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to deploy strategy'
      toast.error(message)
    },
  })
}

export const usePauseDeployment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (deploymentId: string) => pauseDeployment(deploymentId),
    onSuccess: (_, deploymentId) => {
      queryClient.invalidateQueries({ queryKey: chevalierKeys.deployment(deploymentId) })
      queryClient.invalidateQueries({ queryKey: chevalierKeys.deployments() })
      toast.success('Strategy paused')
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to pause strategy'
      toast.error(message)
    },
  })
}

export const useResumeDeployment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (deploymentId: string) => resumeDeployment(deploymentId),
    onSuccess: (_, deploymentId) => {
      queryClient.invalidateQueries({ queryKey: chevalierKeys.deployment(deploymentId) })
      queryClient.invalidateQueries({ queryKey: chevalierKeys.deployments() })
      toast.success('Strategy resumed')
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to resume strategy'
      toast.error(message)
    },
  })
}

export const useStopDeployment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (deploymentId: string) => stopDeployment(deploymentId),
    onSuccess: (_, deploymentId) => {
      queryClient.invalidateQueries({ queryKey: chevalierKeys.deployment(deploymentId) })
      queryClient.invalidateQueries({ queryKey: chevalierKeys.deployments() })
      toast.success('Strategy stopped')
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to stop strategy'
      toast.error(message)
    },
  })
}

export const useUndeployDeployment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (deploymentId: string) => undeployDeployment(deploymentId),
    onSuccess: (_, deploymentId) => {
      queryClient.invalidateQueries({ queryKey: chevalierKeys.deployment(deploymentId) })
      queryClient.invalidateQueries({ queryKey: chevalierKeys.deployments() })
      toast.success('Strategy undeployed')
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to undeploy strategy'
      toast.error(message)
    },
  })
}
