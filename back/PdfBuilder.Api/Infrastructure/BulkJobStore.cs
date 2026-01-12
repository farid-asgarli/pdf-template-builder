using PdfBuilder.Api.Entities;

namespace PdfBuilder.Api.Infrastructure;

/// <summary>
/// In-memory store for bulk generation jobs.
/// In production, this should be replaced with database or distributed cache storage.
/// </summary>
public class BulkJobStore
{
    private readonly Dictionary<int, BulkGenerationJob> _jobs = new();
    private int _jobIdCounter = 0;
    private readonly object _lock = new();

    public int GetNextId()
    {
        lock (_lock)
        {
            return Interlocked.Increment(ref _jobIdCounter);
        }
    }

    public void AddJob(BulkGenerationJob job)
    {
        lock (_lock)
        {
            _jobs[job.Id] = job;
        }
    }

    public BulkGenerationJob? GetJob(int id)
    {
        lock (_lock)
        {
            return _jobs.TryGetValue(id, out var job) ? job : null;
        }
    }

    public void UpdateJob(BulkGenerationJob job)
    {
        lock (_lock)
        {
            if (_jobs.ContainsKey(job.Id))
            {
                _jobs[job.Id] = job;
            }
        }
    }

    public void RemoveJob(int id)
    {
        lock (_lock)
        {
            _jobs.Remove(id);
        }
    }

    public IEnumerable<BulkGenerationJob> GetAllJobs()
    {
        lock (_lock)
        {
            return _jobs.Values.ToList();
        }
    }
}
