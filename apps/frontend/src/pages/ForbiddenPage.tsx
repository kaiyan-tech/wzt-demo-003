import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function ForbiddenPage() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-300">403</h1>
        <p className="text-xl text-slate-600 mt-4">无权访问此页面</p>
        <p className="text-slate-500 mt-2">请联系管理员获取相应权限</p>
        <Button asChild className="mt-6">
          <Link to="/">返回首页</Link>
        </Button>
      </div>
    </div>
  );
}
