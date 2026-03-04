
import { NextApiRequest, NextApiResponse } from 'next'
import apiWrapper from 'lib/api/apiWrapper'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  // Mock response for local development
  const projects = [
    {
      id: 1,
      ref: 'default',
      name: 'Default Project',
      organization_id: 1,
      cloud_provider: 'AWS',
      region: 'us-east-1',
      inserted_at: new Date().toISOString(),
      status: 'ACTIVE_HEALTHY',
      databases: [
        {
            identifier: 'default',
            infra_compute_size: 'nano'
        }
      ]
    },
  ]

  return res.status(200).json({
    projects,
    pagination: {
        count: projects.length
    }
  })
}
