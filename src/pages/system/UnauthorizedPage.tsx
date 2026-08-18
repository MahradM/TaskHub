import { LockKeyhole } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
export function UnauthorizedPage() { return <div className="grid min-h-[70vh] place-items-center text-center"><div><LockKeyhole className="mx-auto size-10 text-amber-500"/><h1 className="mt-5 text-2xl font-bold">You don’t have access</h1><p className="subtle mt-2">Ask a workspace owner or admin if you think this is a mistake.</p><Link to="/dashboard"><Button className="mt-6">Return to dashboard</Button></Link></div></div> }
